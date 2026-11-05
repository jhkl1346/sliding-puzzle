import { describe, expect, it } from 'vitest'
import { type Board, createSolved, EMPTY, isSolved, move } from './board'
import { SHUFFLE_MOVES, SIZES } from './constants'
import { shuffle, shuffleWithMoves } from './shuffle'

const SEEDS = Array.from({ length: 50 }, (_, index) => index * 7919 + 1)

// 섞기 코드와 상관없이 수학적으로 풀 수 있는 배치인지 판정한다.
// - 가로 칸 수가 홀수: 반전 수가 짝수면 풀 수 있다.
// - 가로 칸 수가 짝수: 반전 수 + (아래에서 센 빈칸의 줄 번호)가 홀수면 풀 수 있다.
function isSolvable(board: Board, size: number): boolean {
  const tiles = board.filter((tile) => tile !== EMPTY)
  let inversions = 0
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i]! > tiles[j]!) inversions++
    }
  }

  if (size % 2 === 1) return inversions % 2 === 0

  const emptyRowFromBottom = size - Math.floor(board.indexOf(EMPTY) / size)
  return (inversions + emptyRowFromBottom) % 2 === 1
}

describe.each(SIZES)('shuffle (%i×%i)', (size) => {
  it('같은 시드는 항상 같은 배치를 만든다', () => {
    expect(shuffle(size, 12345)).toEqual(shuffle(size, 12345))
  })

  it('다른 시드는 다른 배치를 만든다', () => {
    expect(shuffle(size, 1)).not.toEqual(shuffle(size, 2))
  })

  it('모든 타일과 빈칸이 한 번씩 들어 있다', () => {
    const board = shuffle(size, 99)
    expect(board.toSorted((a, b) => a - b)).toEqual(createSolved(size).toSorted((a, b) => a - b))
  })

  it('섞은 결과는 완성 상태가 아니다', () => {
    for (const seed of SEEDS) {
      expect(isSolved(shuffle(size, seed), size)).toBe(false)
    }
  })

  it('정해진 횟수 이상 섞고, 직전 이동을 바로 되돌리지 않는다', () => {
    const { moves } = shuffleWithMoves(size, 2024)
    expect(moves.length).toBeGreaterThanOrEqual(SHUFFLE_MOVES[size])
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i]).not.toBe(moves[i - 1])
    }
  })

  it('섞을 때 쓴 이동을 거꾸로 하면 완성 상태로 돌아온다 (역재생)', () => {
    for (const seed of SEEDS) {
      const { board, moves } = shuffleWithMoves(size, seed)
      const restored = moves
        .toReversed()
        .reduce((current, tile) => move(current, size, tile), board)
      expect(isSolved(restored, size)).toBe(true)
    }
  })

  it('섞은 배치는 수학적으로도 풀 수 있다', () => {
    for (const seed of SEEDS) {
      expect(isSolvable(shuffle(size, seed), size)).toBe(true)
    }
  })
})

describe('isSolvable (테스트 도우미 자체 확인)', () => {
  it('타일 두 개를 맞바꾼 배치는 풀 수 없다고 판정한다', () => {
    expect(isSolvable([2, 1, 3, 4, 5, 6, 7, 8, 0], 3)).toBe(false)
    expect(isSolvable([2, 1, ...createSolved(4).slice(2)], 4)).toBe(false)
  })
})
