import type { Size } from './constants'

// 기록 검증 기준. 서버가 완료 제출을 검사할 때 쓴다.

// 사람이 타일 하나를 옮기는 데 걸리는 최소 시간. 이동 횟수 × 이 값보다 빠르면 비현실적인 기록으로 본다.
export const MIN_MOVE_INTERVAL_MS = 30
// 완료 제출 시간과 서버가 잰 경과 시간을 비교할 때 봐주는 여유 (요청이 오가는 시간 등)
export const TIME_TOLERANCE_MS = 1000
// 한 게임에서 받아 주는 최대 이동 수 (너무 큰 요청 차단)
export const MAX_MOVE_LOG_LENGTH = 10_000
// 한 게임에서 받아 주는 최대 시간: 24시간
export const MAX_TIME_MS = 24 * 60 * 60 * 1000

export const GAMES_PAGE_SIZE = 20

// POST /api/games 응답
export interface StartedGame {
  id: string
  size: Size
  seed: number
}

// 완료한 게임 기록
export interface CompletedGame {
  id: string
  size: number
  moves: number
  timeMs: number
  finishedAt: string
}

// POST /api/games/:id/finish 응답
export interface FinishResult {
  game: CompletedGame
  // 이번 기록이 이 크기의 개인 최고 기록(최소 이동, 최단 시간)을 새로 세웠는지
  newBest: { moves: boolean; time: boolean }
}

// GET /api/games 응답
export interface GameList {
  games: CompletedGame[]
  page: number
  pageSize: number
  total: number
}
