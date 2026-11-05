import type { FinishResult, GameList, Size, StartedGame } from '@sliding-puzzle/shared'
import { apiRequest } from './client'

export function createGame(size: Size): Promise<StartedGame> {
  return apiRequest<StartedGame>('/api/games', { method: 'POST', body: { size } })
}

// 이동 횟수는 보내지 않는다. 서버가 moveLog를 재생해서 직접 센다.
export function finishGame(
  id: string,
  { moveLog, timeMs }: { moveLog: number[]; timeMs: number },
): Promise<FinishResult> {
  return apiRequest<FinishResult>(`/api/games/${id}/finish`, {
    method: 'POST',
    body: { moveLog, timeMs },
  })
}

export function abandonGame(id: string): Promise<void> {
  return apiRequest<void>(`/api/games/${id}/abandon`, { method: 'POST' })
}

export function listGames(page: number): Promise<GameList> {
  return apiRequest<GameList>(`/api/games?page=${page}`)
}

export function deleteGame(id: string): Promise<void> {
  return apiRequest<void>(`/api/games/${id}`, { method: 'DELETE' })
}
