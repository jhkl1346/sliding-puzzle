import { describe, expect, it } from 'vitest'
import { isSize, SHUFFLE_MOVES, SIZES } from './constants'

describe('SIZES', () => {
  it('3×3, 4×4, 5×5를 지원한다', () => {
    expect(SIZES).toEqual([3, 4, 5])
  })

  it('모든 크기에 섞기 횟수가 정해져 있다', () => {
    for (const size of SIZES) {
      expect(SHUFFLE_MOVES[size]).toBeGreaterThan(0)
    }
  })
})

describe('isSize', () => {
  it('지원하는 크기만 true를 돌려준다', () => {
    expect(isSize(3)).toBe(true)
    expect(isSize(5)).toBe(true)
    expect(isSize(2)).toBe(false)
    expect(isSize(6)).toBe(false)
    expect(isSize(3.5)).toBe(false)
  })
})
