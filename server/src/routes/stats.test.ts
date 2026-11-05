import { SIZES, STALE_GAME_MS, TREND_DAYS } from '@sliding-puzzle/shared'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { dateInTimeZone, recentDates } from '../services/statsService'
import { createTestApp, loggedInAgent } from '../test/helpers'

const { app, prisma } = createTestApp()

afterAll(async () => {
  await prisma.$disconnect()
})

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

// 테스트용 게임을 DB에 바로 넣는다. (풀이 과정은 games.test.ts에서 확인한다)
function insertGame(
  userId: string,
  game: {
    size?: number
    status: 'COMPLETED' | 'ABANDONED' | 'IN_PROGRESS'
    startedAgoMs?: number
    finishedAt?: Date
    moves?: number
    timeMs?: number
  },
) {
  const finishedAt = game.finishedAt ?? (game.status === 'IN_PROGRESS' ? null : new Date())
  return prisma.game.create({
    data: {
      userId,
      size: game.size ?? 3,
      seed: 1,
      status: game.status,
      startedAt: new Date(Date.now() - (game.startedAgoMs ?? 10 * MINUTE)),
      finishedAt,
      moves: game.moves ?? null,
      timeMs: game.timeMs ?? null,
    },
  })
}

describe('날짜 계산', () => {
  it('최근 날짜 목록은 달이 바뀌어도 이어진다', () => {
    expect(recentDates('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02'])
    expect(recentDates('2027-01-01', 2)).toEqual(['2026-12-31', '2027-01-01'])
  })

  it('같은 순간도 시간대에 따라 날짜가 다르다', () => {
    const instant = new Date('2026-11-04T16:30:00Z') // 한국 시간 11월 5일 새벽 1시 30분
    expect(dateInTimeZone(instant, 'UTC')).toBe('2026-11-04')
    expect(dateInTimeZone(instant, 'Asia/Seoul')).toBe('2026-11-05')
  })
})

describe('GET /api/stats', () => {
  it('기록이 없으면 모든 크기를 빈 값으로, 추이는 7일을 0으로 돌려준다', async () => {
    const { agent } = await loggedInAgent(app)

    const res = await agent.get('/api/stats')

    expect(res.status).toBe(200)
    expect(res.body.timeZone).toBe('UTC')
    expect(res.body.sizes).toEqual(
      SIZES.map((size) => ({
        size,
        completed: 0,
        attempted: 0,
        completionRate: null,
        best: { moves: null, timeMs: null },
        average: { moves: null, timeMs: null },
      })),
    )
    for (const { points } of res.body.trend) {
      expect(points).toHaveLength(TREND_DAYS)
      expect(points.at(-1).date).toBe(dateInTimeZone(new Date(), 'UTC'))
      expect(points.every((point: { games: number }) => point.games === 0)).toBe(true)
    }
  })

  it('크기별 최고 기록·평균·완료율을 계산한다 (오래 방치된 게임은 포기로 센다)', async () => {
    const { agent, userId } = await loggedInAgent(app)
    const other = await loggedInAgent(app)
    await insertGame(userId, { status: 'COMPLETED', moves: 100, timeMs: 60_000 })
    await insertGame(userId, { status: 'COMPLETED', moves: 80, timeMs: 90_000 })
    await insertGame(userId, { status: 'ABANDONED' })
    await insertGame(userId, { status: 'IN_PROGRESS', startedAgoMs: STALE_GAME_MS + MINUTE }) // 방치됨
    await insertGame(userId, { status: 'IN_PROGRESS', startedAgoMs: 5 * MINUTE }) // 아직 푸는 중일 수 있음
    await insertGame(userId, { size: 4, status: 'ABANDONED' })
    // 남의 기록은 섞이지 않아야 한다.
    await insertGame(other.userId, { status: 'COMPLETED', moves: 20, timeMs: 5_000 })

    const res = await agent.get('/api/stats')
    const [three, four, five] = res.body.sizes

    expect(three).toEqual({
      size: 3,
      completed: 2,
      attempted: 4,
      completionRate: 0.5,
      best: { moves: 80, timeMs: 60_000 },
      average: { moves: 90, timeMs: 75_000 },
    })
    expect(four).toMatchObject({ completed: 0, attempted: 1, completionRate: 0 })
    expect(four.best).toEqual({ moves: null, timeMs: null })
    expect(five.attempted).toBe(0)
  })

  it('추이는 요청한 시간대의 날짜로 묶는다', async () => {
    const { agent, userId } = await loggedInAgent(app)
    // 한국 시간으로 이틀 전 새벽 1시 (UTC로는 사흘 전 16시)
    const koreaToday = dateInTimeZone(new Date(), 'Asia/Seoul')
    const koreaMidnight = Date.parse(`${koreaToday}T00:00:00+09:00`)
    const finishedAt = new Date(koreaMidnight - 2 * DAY + 60 * MINUTE)
    await insertGame(userId, { status: 'COMPLETED', moves: 50, timeMs: 40_000, finishedAt })
    await insertGame(userId, { status: 'COMPLETED', moves: 70, timeMs: 60_000, finishedAt })

    const korea = await agent.get('/api/stats?tz=Asia/Seoul')
    const utc = await agent.get('/api/stats?tz=UTC')
    const pointOn = (body: typeof korea.body, date: string) =>
      body.trend
        .find((item: { size: number }) => item.size === 3)
        .points.find((point: { date: string }) => point.date === date)

    const koreaDate = dateInTimeZone(finishedAt, 'Asia/Seoul')
    const utcDate = dateInTimeZone(finishedAt, 'UTC')
    expect(koreaDate).not.toBe(utcDate)
    expect(pointOn(korea.body, koreaDate)).toEqual({
      date: koreaDate,
      games: 2,
      averageMoves: 60,
      averageTimeMs: 50_000,
    })
    expect(pointOn(korea.body, utcDate)?.games ?? 0).toBe(0)
    expect(pointOn(utc.body, utcDate).games).toBe(2)
  })

  it('7일보다 오래된 기록은 추이에서 빠지지만 최고 기록에는 들어간다', async () => {
    const { agent, userId } = await loggedInAgent(app)
    await insertGame(userId, {
      status: 'COMPLETED',
      moves: 30,
      timeMs: 20_000,
      finishedAt: new Date(Date.now() - 10 * DAY),
      startedAgoMs: 10 * DAY,
    })

    const res = await agent.get('/api/stats')

    expect(res.body.sizes[0].best).toEqual({ moves: 30, timeMs: 20_000 })
    const games = res.body.trend[0].points.reduce(
      (sum: number, point: { games: number }) => sum + point.games,
      0,
    )
    expect(games).toBe(0)
  })

  it('잘못된 시간대는 400', async () => {
    const { agent } = await loggedInAgent(app)

    const res = await agent.get('/api/stats?tz=Mars/Olympus')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('로그인하지 않으면 401', async () => {
    expect((await request(app).get('/api/stats')).status).toBe(401)
  })
})
