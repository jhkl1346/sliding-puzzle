import { describe, expect, it } from 'vitest'
import { tileColor, tileHue } from './tileColor'

describe('tileHue', () => {
  it('왼쪽 위 타일은 하늘색, 마지막 칸으로 갈수록 분홍에 가까워진다', () => {
    expect(tileHue(1, 3)).toBe(195)
    // 3×3의 마지막 타일(8)은 3행 2열: 마지막 칸(3행 3열) 바로 앞
    expect(tileHue(8, 3)).toBe(296)
  })

  it('같은 대각선에 있는 타일은 같은 색이다', () => {
    // 3×3: 타일 2(1행 2열)와 타일 4(2행 1열)
    expect(tileHue(2, 3)).toBe(tileHue(4, 3))
  })

  it('판 크기가 달라도 같은 범위 안에서 색을 나눈다', () => {
    for (const size of [3, 4, 5, 6]) {
      const hues = Array.from({ length: size * size - 1 }, (_, index) => tileHue(index + 1, size))
      expect(Math.min(...hues)).toBe(195)
      expect(Math.max(...hues)).toBeLessThan(330)
    }
  })
})

describe('tileColor', () => {
  it('밝은 파스텔 HSL 색을 돌려준다', () => {
    expect(tileColor(1, 4)).toBe('hsl(195 85% 86%)')
  })
})
