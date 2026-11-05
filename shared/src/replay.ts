import { canMove, isSolved, move } from './board'
import { isSize } from './constants'
import { shuffle } from './shuffle'

export type ReplayFailure =
  | { ok: false; reason: 'INVALID_SIZE' }
  // moveIndex: moveLog에서 처음으로 불가능한 이동이 나온 위치 (0부터)
  | { ok: false; reason: 'INVALID_MOVE'; moveIndex: number }
  | { ok: false; reason: 'NOT_SOLVED' }

export type ReplayResult = { ok: true; moves: number } | ReplayFailure

// 시드로 처음 배치를 다시 만들고, 이동 기록을 하나씩 재생해서 정말 완성되는지 확인한다.
// 서버는 클라이언트가 보낸 이동 횟수 대신 이 결과의 moves를 쓴다.
export function replay(size: number, seed: number, moveLog: readonly number[]): ReplayResult {
  if (!isSize(size)) return { ok: false, reason: 'INVALID_SIZE' }

  let board = shuffle(size, seed)

  for (const [moveIndex, tile] of moveLog.entries()) {
    if (!canMove(board, size, tile)) {
      return { ok: false, reason: 'INVALID_MOVE', moveIndex }
    }
    board = move(board, size, tile)
  }

  if (!isSolved(board, size)) return { ok: false, reason: 'NOT_SOLVED' }

  return { ok: true, moves: moveLog.length }
}
