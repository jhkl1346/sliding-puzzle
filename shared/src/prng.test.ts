import { describe, expect, it } from 'vitest'
import { createRandom } from './prng'

function take(random: () => number, count: number): number[] {
  return Array.from({ length: count }, () => random())
}

describe('createRandom', () => {
  it('같은 시드는 같은 순서의 수를 만든다', () => {
    expect(take(createRandom(42), 10)).toEqual(take(createRandom(42), 10))
  })

  it('다른 시드는 다른 순서의 수를 만든다', () => {
    expect(take(createRandom(1), 10)).not.toEqual(take(createRandom(2), 10))
  })

  it('0 이상 1 미만의 수만 만든다', () => {
    for (const value of take(createRandom(7), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
