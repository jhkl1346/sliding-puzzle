import { randomInt } from 'node:crypto'
import {
  type CompletedGame,
  type FinishResult,
  GAMES_PAGE_SIZE,
  type GameList,
  MAX_SEED,
  MIN_MOVE_INTERVAL_MS,
  replay,
  type ReplayFailure,
  type Size,
  type StartedGame,
  TIME_TOLERANCE_MS,
} from '@sliding-puzzle/shared'
import { AppError } from '../errors'
import type { PrismaClient } from '../generated/prisma/client'
import { GameStatus } from '../generated/prisma/enums'
import type { FinishGameInput } from '../schemas/games'

const GAME_NOT_FOUND = new AppError(404, 'GAME_NOT_FOUND', '게임을 찾을 수 없어요.')
const GAME_ALREADY_ENDED = new AppError(409, 'GAME_ALREADY_ENDED', '이미 끝난 게임이에요.')

const REPLAY_FAILURE_MESSAGES: Record<ReplayFailure['reason'], string> = {
  INVALID_SIZE: '지원하지 않는 판 크기의 게임이에요.',
  INVALID_MOVE: '이동 기록에 불가능한 이동이 있어요.',
  NOT_SOLVED: '이동 기록대로 움직여도 퍼즐이 완성되지 않아요.',
}

function toCompletedGame(game: {
  id: string
  size: number
  moves: number | null
  timeMs: number | null
  finishedAt: Date | null
}): CompletedGame {
  return {
    id: game.id,
    size: game.size,
    moves: game.moves!,
    timeMs: game.timeMs!,
    finishedAt: game.finishedAt!.toISOString(),
  }
}

export function createGameService(prisma: PrismaClient) {
  return {
    async start(userId: string, size: Size): Promise<StartedGame> {
      const game = await prisma.game.create({
        data: { userId, size, seed: randomInt(0, MAX_SEED + 1) },
      })
      return { id: game.id, size, seed: game.seed }
    },

    async finish(
      userId: string,
      gameId: string,
      { moveLog, timeMs }: FinishGameInput,
      now = new Date(),
    ): Promise<FinishResult> {
      // 내 게임이 아니면 존재 여부를 숨기기 위해 없는 게임과 똑같이 404로 응답한다.
      const game = await prisma.game.findFirst({ where: { id: gameId, userId } })
      if (!game) throw GAME_NOT_FOUND
      if (game.status !== GameStatus.IN_PROGRESS) throw GAME_ALREADY_ENDED

      // 1) 처음 배치부터 이동 기록을 재생해서 정말 완성되는지 확인하고, 이동 횟수를 서버가 직접 센다.
      const result = replay(game.size, game.seed, moveLog)
      if (!result.ok) {
        throw new AppError(400, 'INVALID_MOVE_LOG', REPLAY_FAILURE_MESSAGES[result.reason])
      }
      const moves = result.moves

      // 2) 시간은 완전히 검증할 수 없으므로, 비현실적인 값만 막는다.
      if (timeMs < moves * MIN_MOVE_INTERVAL_MS) {
        throw new AppError(400, 'INVALID_TIME', '이동 횟수에 비해 걸린 시간이 너무 짧아요.')
      }
      if (timeMs > now.getTime() - game.startedAt.getTime() + TIME_TOLERANCE_MS) {
        throw new AppError(400, 'INVALID_TIME', '게임을 시작한 뒤 지난 시간보다 기록이 길어요.')
      }

      const previousBest = await prisma.game.aggregate({
        where: { userId, size: game.size, status: GameStatus.COMPLETED },
        _min: { moves: true, timeMs: true },
      })

      // 3) "아직 진행 중인 내 게임"일 때만 바꾼다. 같은 요청이 동시에 두 번 와도 한 번만 저장된다.
      const { count } = await prisma.game.updateMany({
        where: { id: gameId, userId, status: GameStatus.IN_PROGRESS },
        data: { status: GameStatus.COMPLETED, finishedAt: now, moves, timeMs, moveLog },
      })
      if (count === 0) throw GAME_ALREADY_ENDED

      const bestMoves = previousBest._min.moves
      const bestTime = previousBest._min.timeMs
      return {
        game: toCompletedGame({ id: gameId, size: game.size, moves, timeMs, finishedAt: now }),
        newBest: {
          moves: bestMoves === null || moves < bestMoves,
          time: bestTime === null || timeMs < bestTime,
        },
      }
    },

    async abandon(userId: string, gameId: string, now = new Date()): Promise<void> {
      const { count } = await prisma.game.updateMany({
        where: { id: gameId, userId, status: GameStatus.IN_PROGRESS },
        data: { status: GameStatus.ABANDONED, finishedAt: now },
      })
      if (count > 0) return

      const exists = await prisma.game.count({ where: { id: gameId, userId } })
      throw exists ? GAME_ALREADY_ENDED : GAME_NOT_FOUND
    },

    async list(userId: string, { size, page }: { size?: Size; page: number }): Promise<GameList> {
      const where = { userId, status: GameStatus.COMPLETED, ...(size ? { size } : {}) }
      const [games, total] = await Promise.all([
        prisma.game.findMany({
          where,
          orderBy: { finishedAt: 'desc' },
          skip: (page - 1) * GAMES_PAGE_SIZE,
          take: GAMES_PAGE_SIZE,
          select: { id: true, size: true, moves: true, timeMs: true, finishedAt: true },
        }),
        prisma.game.count({ where }),
      ])
      return { games: games.map(toCompletedGame), page, pageSize: GAMES_PAGE_SIZE, total }
    },

    async remove(userId: string, gameId: string): Promise<void> {
      // 조건에 userId를 넣어서 남의 기록은 지워지지 않게 한다.
      const { count } = await prisma.game.deleteMany({ where: { id: gameId, userId } })
      if (count === 0) throw GAME_NOT_FOUND
    },
  }
}
