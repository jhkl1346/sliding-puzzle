import { describe, expect, it } from 'vitest'
import { SIZES } from './constants'

describe('SIZES', () => {
  it('3×3, 4×4, 5×5를 지원한다', () => {
    expect(SIZES).toEqual([3, 4, 5])
  })
})
