import { describe, expect, it } from 'vitest'
import { canMove, createSolved, isSolved, move, movableTiles } from './board'

// 3×3 완성 상태
// 1 2 3
// 4 5 6
// 7 8 _
const solved3 = createSolved(3)

describe('createSolved', () => {
  it('1부터 순서대로 놓고 마지막 칸을 비운다', () => {
    expect(createSolved(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0])
    expect(createSolved(4)).toHaveLength(16)
  })
})

describe('isSolved', () => {
  it('완성 상태면 true', () => {
    expect(isSolved(solved3, 3)).toBe(true)
  })

  it('한 칸이라도 다르면 false', () => {
    expect(isSolved([1, 2, 3, 4, 5, 6, 7, 0, 8], 3)).toBe(false)
  })

  it('크기가 맞지 않으면 false', () => {
    expect(isSolved(solved3, 4)).toBe(false)
  })
})

describe('canMove', () => {
  it('빈칸과 위아래·좌우로 붙은 타일만 움직일 수 있다', () => {
    expect(canMove(solved3, 3, 6)).toBe(true)
    expect(canMove(solved3, 3, 8)).toBe(true)
    expect(canMove(solved3, 3, 5)).toBe(false) // 대각선
    expect(canMove(solved3, 3, 1)).toBe(false)
  })

  it('줄 끝과 다음 줄 시작은 붙어 있지 않다', () => {
    // 1 2 3
    // _ 4 5
    // 6 7 8
    const board = [1, 2, 3, 0, 4, 5, 6, 7, 8]
    expect(canMove(board, 3, 3)).toBe(false) // 배열에서는 옆이지만 판에서는 윗줄 오른쪽 끝
    expect(canMove(board, 3, 4)).toBe(true)
  })

  it('없는 타일, 빈칸, 정수가 아닌 값은 움직일 수 없다', () => {
    expect(canMove(solved3, 3, 0)).toBe(false)
    expect(canMove(solved3, 3, 9)).toBe(false)
    expect(canMove(solved3, 3, -1)).toBe(false)
    expect(canMove(solved3, 3, 6.5)).toBe(false)
  })
})

describe('move', () => {
  it('타일과 빈칸의 자리를 바꾼 새 보드를 돌려준다', () => {
    expect(move(solved3, 3, 6)).toEqual([1, 2, 3, 4, 5, 0, 7, 8, 6])
  })

  it('원래 보드는 바꾸지 않는다', () => {
    const before = [...solved3]
    move(solved3, 3, 8)
    expect(solved3).toEqual(before)
  })

  it('움직일 수 없는 타일이면 에러를 던진다', () => {
    expect(() => move(solved3, 3, 1)).toThrow('타일 1은(는) 움직일 수 없어요.')
  })
})

describe('movableTiles', () => {
  it('빈칸 주변 타일을 작은 번호부터 돌려준다', () => {
    expect(movableTiles(solved3, 3)).toEqual([6, 8])
    // 1 2 3
    // 4 _ 5
    // 6 7 8
    expect(movableTiles([1, 2, 3, 4, 0, 5, 6, 7, 8], 3)).toEqual([2, 4, 5, 7])
  })
})
