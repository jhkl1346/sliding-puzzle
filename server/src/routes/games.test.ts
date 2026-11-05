import {
  GAMES_PAGE_SIZE,
  MAX_MOVE_LOG_LENGTH,
  MIN_MOVE_INTERVAL_MS,
  shuffleWithMoves,
  type Size,
} from '@sliding-puzzle/shared'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createTestApp, loggedInAgent } from '../test/helpers'

const { app, prisma } = createTestApp()

afterAll(async () => {
  await prisma.$disconnect()
})

type Agent = Awaited<ReturnType<typeof loggedInAgent>>['agent']

// 섞을 때 쓴 이동을 거꾸로 하면 올바른 풀이가 된다.
function solutionFor(size: Size, seed: number): number[] {
  return shuffleWithMoves(size, seed).moves.toReversed()
}

async function startGame(agent: Agent, size: Size = 3) {
  const res = await agent.post('/api/games').send({ size })
  expect(res.status).toBe(201)
  return res.body as { id: string; size: Size; seed: number }
}

// 실제로 풀 만큼 시간이 지난 것처럼, 게임 시작 시각을 과거로 옮긴다.
async function pretendStartedAgo(gameId: string, ms: number) {
  await prisma.game.update({
    where: { id: gameId },
    data: { startedAt: new Date(Date.now() - ms) },
  })
}

// 시작 → 올바른 풀이로 완료 제출
async function playAndFinish(agent: Agent, { size = 3 as Size, timeMs = 60_000 } = {}) {
  const game = await startGame(agent, size)
  await pretendStartedAgo(game.id, 10 * 60_000)
  const moveLog = solutionFor(size, game.seed)
  const res = await agent.post(`/api/games/${game.id}/finish`).send({ moveLog, timeMs })
  return { game, moveLog, res }
}

describe('POST /api/games', () => {
  it('게임을 시작하면 서버가 정한 시드를 돌려주고 IN_PROGRESS로 저장한다', async () => {
    const { agent, userId } = await loggedInAgent(app)

    const game = await startGame(agent, 4)

    expect(game).toEqual({ id: expect.any(String), size: 4, seed: expect.any(Number) })
    expect(Number.isInteger(game.seed) && game.seed >= 0).toBe(true)
    const saved = await prisma.game.findUniqueOrThrow({ where: { id: game.id } })
    expect(saved).toMatchObject({ userId, size: 4, seed: game.seed, status: 'IN_PROGRESS' })
  })

  it('지원하지 않는 크기나 잘못된 값은 400', async () => {
    const { agent } = await loggedInAgent(app)

    for (const body of [{ size: 6 }, { size: 2 }, { size: '3' }, {}]) {
      const res = await agent.post('/api/games').send(body)
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('로그인하지 않으면 401', async () => {
    const res = await request(app).post('/api/games').send({ size: 3 })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/games/:id/finish', () => {
  it('올바른 풀이면 COMPLETED로 저장하고, 이동 횟수는 서버가 센 값을 쓴다', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    await pretendStartedAgo(game.id, 10 * 60_000)
    const moveLog = solutionFor(3, game.seed)

    // 클라이언트가 이동 횟수를 1이라고 속여 보내도 무시한다.
    const res = await agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog, timeMs: 45_000, moves: 1 })

    expect(res.status).toBe(200)
    expect(res.body.game).toEqual({
      id: game.id,
      size: 3,
      moves: moveLog.length,
      timeMs: 45_000,
      finishedAt: expect.any(String),
    })
    const saved = await prisma.game.findUniqueOrThrow({ where: { id: game.id } })
    expect(saved).toMatchObject({ status: 'COMPLETED', moves: moveLog.length, timeMs: 45_000 })
    expect(saved.moveLog).toEqual(moveLog)
  })

  it('첫 기록은 개인 최고 기록이고, 이후에는 더 좋을 때만 갱신으로 알려준다', async () => {
    const { agent } = await loggedInAgent(app)

    const first = await playAndFinish(agent, { timeMs: 60_000 })
    expect(first.res.body.newBest).toEqual({ moves: true, time: true })

    const slower = await playAndFinish(agent, { timeMs: 90_000 })
    expect(slower.res.body.newBest.time).toBe(false)

    const faster = await playAndFinish(agent, { timeMs: 30_000 })
    expect(faster.res.body.newBest.time).toBe(true)

    // 다른 크기는 따로 센다.
    const otherSize = await playAndFinish(agent, { size: 4, timeMs: 120_000 })
    expect(otherSize.res.body.newBest).toEqual({ moves: true, time: true })
  })

  it('중간에 불가능한 이동이 있는 조작된 기록은 400 INVALID_MOVE_LOG', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    await pretendStartedAgo(game.id, 60_000)
    const moveLog = solutionFor(3, game.seed)
    // 판에 없는 타일 번호를 끼워 넣는다.
    const tampered = [...moveLog.slice(0, 5), 99, ...moveLog.slice(5)]

    const res = await agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog: tampered, timeMs: 30_000 })

    expect(res.status).toBe(400)
    expect(res.body.error).toEqual({
      code: 'INVALID_MOVE_LOG',
      message: '이동 기록에 불가능한 이동이 있어요.',
    })
    const saved = await prisma.game.findUniqueOrThrow({ where: { id: game.id } })
    expect(saved.status).toBe('IN_PROGRESS')
  })

  it('끝까지 재생해도 완성되지 않는 기록은 400 INVALID_MOVE_LOG', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    await pretendStartedAgo(game.id, 60_000)
    const moveLog = solutionFor(3, game.seed)

    const notSolved = await agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog: moveLog.slice(0, -1), timeMs: 30_000 })
    const empty = await agent.post(`/api/games/${game.id}/finish`).send({ moveLog: [], timeMs: 0 })

    expect(notSolved.status).toBe(400)
    expect(notSolved.body.error.message).toBe('이동 기록대로 움직여도 퍼즐이 완성되지 않아요.')
    expect(empty.body.error.code).toBe('INVALID_MOVE_LOG')
  })

  it('다른 시드의 풀이를 그대로 가져와도 통과하지 못한다', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    await pretendStartedAgo(game.id, 60_000)

    const res = await agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog: solutionFor(3, game.seed + 1), timeMs: 30_000 })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_MOVE_LOG')
  })

  it('이동 횟수에 비해 너무 짧은 시간은 400 INVALID_TIME', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    await pretendStartedAgo(game.id, 60_000)
    const moveLog = solutionFor(3, game.seed)

    const res = await agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog, timeMs: moveLog.length * MIN_MOVE_INTERVAL_MS - 1 })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_TIME')
  })

  it('게임을 시작한 뒤 지난 시간보다 긴 기록은 400 INVALID_TIME', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    await pretendStartedAgo(game.id, 60_000)

    const res = await agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog: solutionFor(3, game.seed), timeMs: 10 * 60_000 })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('게임을 시작한 뒤 지난 시간보다 기록이 길어요.')
  })

  it('같은 게임을 두 번 제출하면 두 번째는 409이고, 첫 기록은 바뀌지 않는다', async () => {
    const { agent } = await loggedInAgent(app)
    const { game, moveLog } = await playAndFinish(agent, { timeMs: 60_000 })

    const second = await agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog, timeMs: 20_000 })

    expect(second.status).toBe(409)
    expect(second.body.error.code).toBe('GAME_ALREADY_ENDED')
    const saved = await prisma.game.findUniqueOrThrow({ where: { id: game.id } })
    expect(saved.timeMs).toBe(60_000)
  })

  it('동시에 두 번 제출해도 한 번만 저장된다', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    await pretendStartedAgo(game.id, 60_000)
    const body = { moveLog: solutionFor(3, game.seed), timeMs: 30_000 }

    const results = await Promise.all([
      agent.post(`/api/games/${game.id}/finish`).send(body),
      agent.post(`/api/games/${game.id}/finish`).send(body),
    ])

    expect(results.map((res) => res.status).toSorted()).toEqual([200, 409])
  })

  it('남의 게임은 없는 게임처럼 404로 거부하고, 그 게임은 바뀌지 않는다', async () => {
    const owner = await loggedInAgent(app)
    const intruder = await loggedInAgent(app)
    const game = await startGame(owner.agent)
    await pretendStartedAgo(game.id, 60_000)

    const res = await intruder.agent
      .post(`/api/games/${game.id}/finish`)
      .send({ moveLog: solutionFor(3, game.seed), timeMs: 30_000 })

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('GAME_NOT_FOUND')
    const saved = await prisma.game.findUniqueOrThrow({ where: { id: game.id } })
    expect(saved.status).toBe('IN_PROGRESS')
  })

  it('없는 게임은 404', async () => {
    const { agent } = await loggedInAgent(app)

    const res = await agent
      .post('/api/games/no-such-game/finish')
      .send({ moveLog: [1], timeMs: 1000 })

    expect(res.status).toBe(404)
  })

  it('너무 긴 이동 기록이나 잘못된 형식은 400 VALIDATION_ERROR', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)
    const url = `/api/games/${game.id}/finish`

    const tooLong = await agent
      .post(url)
      .send({ moveLog: Array.from({ length: MAX_MOVE_LOG_LENGTH + 1 }, () => 1), timeMs: 1000 })
    const notInteger = await agent.post(url).send({ moveLog: [1.5], timeMs: 1000 })
    const negativeTime = await agent.post(url).send({ moveLog: [1], timeMs: -1 })
    const missing = await agent.post(url).send({})

    for (const res of [tooLong, notInteger, negativeTime, missing]) {
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })
})

describe('POST /api/games/:id/abandon', () => {
  it('진행 중인 게임을 ABANDONED로 바꾼다', async () => {
    const { agent } = await loggedInAgent(app)
    const game = await startGame(agent)

    const res = await agent.post(`/api/games/${game.id}/abandon`)

    expect(res.status).toBe(204)
    const saved = await prisma.game.findUniqueOrThrow({ where: { id: game.id } })
    expect(saved.status).toBe('ABANDONED')
    expect(saved.finishedAt).not.toBeNull()
  })

  it('포기한 게임은 완료할 수 없고, 끝난 게임은 포기할 수 없다 (409)', async () => {
    const { agent } = await loggedInAgent(app)
    const abandoned = await startGame(agent)
    await agent.post(`/api/games/${abandoned.id}/abandon`)
    const { game: completed } = await playAndFinish(agent)

    const finishAbandoned = await agent
      .post(`/api/games/${abandoned.id}/finish`)
      .send({ moveLog: solutionFor(3, abandoned.seed), timeMs: 30_000 })
    const abandonCompleted = await agent.post(`/api/games/${completed.id}/abandon`)

    expect(finishAbandoned.status).toBe(409)
    expect(abandonCompleted.status).toBe(409)
  })

  it('남의 게임은 404이고, 그 게임은 바뀌지 않는다', async () => {
    const owner = await loggedInAgent(app)
    const intruder = await loggedInAgent(app)
    const game = await startGame(owner.agent)

    const res = await intruder.agent.post(`/api/games/${game.id}/abandon`)

    expect(res.status).toBe(404)
    const saved = await prisma.game.findUniqueOrThrow({ where: { id: game.id } })
    expect(saved.status).toBe('IN_PROGRESS')
  })
})

describe('GET /api/games', () => {
  it('내 완료 기록만 최근 것부터 돌려준다 (진행 중·포기·남의 기록 제외)', async () => {
    const me = await loggedInAgent(app)
    const other = await loggedInAgent(app)
    const first = await playAndFinish(me.agent, { timeMs: 50_000 })
    const second = await playAndFinish(me.agent, { size: 4, timeMs: 70_000 })
    await startGame(me.agent) // 진행 중
    const abandoned = await startGame(me.agent)
    await me.agent.post(`/api/games/${abandoned.id}/abandon`)
    await playAndFinish(other.agent)

    const res = await me.agent.get('/api/games')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, pageSize: GAMES_PAGE_SIZE, total: 2 })
    expect(res.body.games.map((game: { id: string }) => game.id)).toEqual([
      second.game.id,
      first.game.id,
    ])
    expect(res.body.games[0]).toEqual({
      id: second.game.id,
      size: 4,
      moves: second.moveLog.length,
      timeMs: 70_000,
      finishedAt: expect.any(String),
    })
  })

  it('크기로 거르고, 페이지를 나눈다', async () => {
    const { agent } = await loggedInAgent(app)
    await playAndFinish(agent, { size: 3 })
    await playAndFinish(agent, { size: 4 })

    const onlyFour = await agent.get('/api/games?size=4')
    const page2 = await agent.get('/api/games?page=2')

    expect(onlyFour.body.total).toBe(1)
    expect(onlyFour.body.games[0].size).toBe(4)
    expect(page2.body).toMatchObject({ page: 2, total: 2, games: [] })
  })

  it('잘못된 쿼리는 400', async () => {
    const { agent } = await loggedInAgent(app)

    expect((await agent.get('/api/games?size=7')).status).toBe(400)
    expect((await agent.get('/api/games?page=0')).status).toBe(400)
    expect((await agent.get('/api/games?page=abc')).status).toBe(400)
  })

  it('로그인하지 않으면 401', async () => {
    expect((await request(app).get('/api/games')).status).toBe(401)
  })
})

describe('DELETE /api/games/:id', () => {
  it('내 기록을 지운다', async () => {
    const { agent } = await loggedInAgent(app)
    const { game } = await playAndFinish(agent)

    const res = await agent.delete(`/api/games/${game.id}`)

    expect(res.status).toBe(204)
    expect(await prisma.game.findUnique({ where: { id: game.id } })).toBeNull()
  })

  it('남의 기록은 지울 수 없다 (404, 기록은 그대로)', async () => {
    const owner = await loggedInAgent(app)
    const intruder = await loggedInAgent(app)
    const { game } = await playAndFinish(owner.agent)

    const res = await intruder.agent.delete(`/api/games/${game.id}`)

    expect(res.status).toBe(404)
    expect(await prisma.game.findUnique({ where: { id: game.id } })).not.toBeNull()
  })

  it('로그인하지 않으면 401', async () => {
    expect((await request(app).delete('/api/games/anything')).status).toBe(401)
  })
})
