import { type Board, createSolved, isSolved, move, movableTiles } from './board'
import { SHUFFLE_MOVES, type Size } from './constants'
import { createRandom } from './prng'

export interface ShuffleResult {
  board: Board
  // 섞을 때 움직인 타일 순서. 거꾸로 다시 움직이면 완성 상태로 돌아온다.
  moves: number[]
}

// 완성 상태에서 합법적인 이동만 반복해서 섞는다. 그래서 항상 풀 수 있는 배치가 나온다.
export function shuffleWithMoves(size: Size, seed: number): ShuffleResult {
  const random = createRandom(seed)
  let board = createSolved(size)
  const moves: number[] = []

  // 다 섞었는데 우연히 완성 상태면 같은 난수로 이어서 더 섞는다.
  while (moves.length < SHUFFLE_MOVES[size] || isSolved(board, size)) {
    const lastTile = moves.at(-1)
    // 방금 움직인 타일을 다시 움직이면 직전 이동이 되돌려지므로 뺀다.
    const candidates = movableTiles(board, size).filter((tile) => tile !== lastTile)
    const tile = candidates[Math.floor(random() * candidates.length)]!
    board = move(board, size, tile)
    moves.push(tile)
  }

  return { board, moves }
}

export function shuffle(size: Size, seed: number): Board {
  return shuffleWithMoves(size, seed).board
}
