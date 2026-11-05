import {
  type SizeStats,
  SIZES,
  STALE_GAME_MS,
  type StatsResponse,
  TREND_DAYS,
  type TrendPoint,
} from '@sliding-puzzle/shared'
import type { PrismaClient } from '../generated/prisma/client'
import { GameStatus } from '../generated/prisma/enums'

const DAY_MS = 24 * 60 * 60 * 1000

export function isValidTimeZone(timeZone: string): boolean {
  try {
    // 모르는 시간대면 RangeError가 난다.
    return Boolean(new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone)
  } catch {
    return false
  }
}

// 그 시간대에서 본 날짜 (YYYY-MM-DD)
export function dateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// today를 마지막 날로 하는 최근 days일 (오래된 날짜부터)
export function recentDates(today: string, days: number): string[] {
  const [year, month, day] = today.split('-').map(Number) as [number, number, number]
  return Array.from({ length: days }, (_, index) =>
    new Date(Date.UTC(year, month - 1, day - (days - 1 - index))).toISOString().slice(0, 10),
  )
}

interface DailyRow {
  date: string
  size: number
  games: number
  averageMoves: number
  averageTimeMs: number
}

export function createStatsService(prisma: PrismaClient) {
  return {
    async get(userId: string, timeZone: string, now = new Date()): Promise<StatsResponse> {
      const staleBefore = new Date(now.getTime() - STALE_GAME_MS)
      // 시간대 차이를 넉넉히 덮도록 하루 더 가져온 뒤, 날짜 목록에 있는 것만 쓴다.
      const trendSince = new Date(now.getTime() - (TREND_DAYS + 1) * DAY_MS)

      const [completed, notCompleted, daily] = await Promise.all([
        prisma.game.groupBy({
          by: ['size'],
          where: { userId, status: GameStatus.COMPLETED },
          _count: { _all: true },
          _min: { moves: true, timeMs: true },
          _avg: { moves: true, timeMs: true },
        }),
        // 포기한 게임 + 오래 방치된 진행 중 게임 (아직 풀고 있을 수 있는 최근 게임은 빼고 센다)
        prisma.game.groupBy({
          by: ['size'],
          where: {
            userId,
            OR: [
              { status: GameStatus.ABANDONED },
              { status: GameStatus.IN_PROGRESS, startedAt: { lt: staleBefore } },
            ],
          },
          _count: { _all: true },
        }),
        // DB에는 UTC로 저장되어 있으므로, 요청한 시간대의 날짜로 바꿔서 하루 단위로 묶는다.
        prisma.$queryRaw<DailyRow[]>`
          SELECT
            to_char(("finishedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS "date",
            "size",
            count(*)::int AS "games",
            avg("moves")::float8 AS "averageMoves",
            avg("timeMs")::float8 AS "averageTimeMs"
          FROM "Game"
          WHERE "userId" = ${userId}
            AND "status" = 'COMPLETED'::"GameStatus"
            AND "finishedAt" >= ${trendSince}
          GROUP BY 1, 2
        `,
      ])

      const sizes: SizeStats[] = SIZES.map((size) => {
        const done = completed.find((row) => row.size === size)
        const doneCount = done?._count._all ?? 0
        const attempted =
          doneCount + (notCompleted.find((row) => row.size === size)?._count._all ?? 0)
        return {
          size,
          completed: doneCount,
          attempted,
          completionRate: attempted === 0 ? null : doneCount / attempted,
          best: { moves: done?._min.moves ?? null, timeMs: done?._min.timeMs ?? null },
          average: { moves: done?._avg.moves ?? null, timeMs: done?._avg.timeMs ?? null },
        }
      })

      const dates = recentDates(dateInTimeZone(now, timeZone), TREND_DAYS)
      const trend = SIZES.map((size) => ({
        size,
        points: dates.map((date): TrendPoint => {
          const row = daily.find((item) => item.size === size && item.date === date)
          return {
            date,
            games: row?.games ?? 0,
            averageMoves: row?.averageMoves ?? null,
            averageTimeMs: row?.averageTimeMs ?? null,
          }
        }),
      }))

      return { timeZone, sizes, trend }
    },
  }
}
