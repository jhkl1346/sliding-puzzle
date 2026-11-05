// 길이 size*size인 배열. 왼쪽 위부터 한 줄씩 채우고, 0이 빈칸이다.
export type Board = readonly number[]

export const EMPTY = 0

// 완성 상태: 1, 2, 3, ... 순서이고 빈칸이 오른쪽 아래에 있다.
export function createSolved(size: number): Board {
  const cells = size * size
  return Array.from({ length: cells }, (_, index) => (index === cells - 1 ? EMPTY : index + 1))
}

export function isSolved(board: Board, size: number): boolean {
  const solved = createSolved(size)
  return board.length === solved.length && board.every((tile, index) => tile === solved[index])
}

// 두 칸이 위아래나 좌우로 붙어 있는지. (줄이 바뀌는 오른쪽 끝과 다음 줄 왼쪽 끝은 붙어 있지 않다)
function isAdjacent(a: number, b: number, size: number): boolean {
  const rowA = Math.floor(a / size)
  const colA = a % size
  const rowB = Math.floor(b / size)
  const colB = b % size
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1
}

// 빈칸과 붙어 있는 타일만 움직일 수 있다.
export function canMove(board: Board, size: number, tile: number): boolean {
  if (!Number.isInteger(tile) || tile === EMPTY) return false

  const tileIndex = board.indexOf(tile)
  if (tileIndex === -1) return false

  return isAdjacent(tileIndex, board.indexOf(EMPTY), size)
}

// 타일을 빈칸으로 옮긴 새 보드를 돌려준다. 원래 보드는 바꾸지 않는다.
export function move(board: Board, size: number, tile: number): Board {
  if (!canMove(board, size, tile)) {
    throw new Error(`타일 ${tile}은(는) 움직일 수 없어요.`)
  }

  const tileIndex = board.indexOf(tile)
  const emptyIndex = board.indexOf(EMPTY)
  const next = [...board]
  next[emptyIndex] = tile
  next[tileIndex] = EMPTY
  return next
}

// 지금 움직일 수 있는 타일 번호 목록 (작은 번호부터).
export function movableTiles(board: Board, size: number): number[] {
  return board.filter((tile) => canMove(board, size, tile)).toSorted((a, b) => a - b)
}

export type Direction = 'up' | 'down' | 'left' | 'right'

// 방향키를 눌렀을 때 움직일 타일. 예: 'up'이면 빈칸 바로 아래 타일이 위로 올라온다.
// 그 방향으로 움직일 타일이 없으면 null.
export function tileInDirection(board: Board, size: number, direction: Direction): number | null {
  const emptyIndex = board.indexOf(EMPTY)
  const row = Math.floor(emptyIndex / size)
  const col = emptyIndex % size

  const [tileRow, tileCol] = {
    up: [row + 1, col],
    down: [row - 1, col],
    left: [row, col + 1],
    right: [row, col - 1],
  }[direction]

  if (tileRow < 0 || tileRow >= size || tileCol < 0 || tileCol >= size) return null
  return board[tileRow * size + tileCol] ?? null
}
