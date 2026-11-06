import { describe, expect, it } from 'vitest'
import { pickTheme, TILE_THEMES, tileColors } from './tileThemes'

const theme = (id: string) => TILE_THEMES.find((item) => item.id === id)!

describe('TILE_THEMES', () => {
  it('그라데이션 4개와 체크무늬 4개, 모두 8개이고 id가 겹치지 않는다', () => {
    expect(TILE_THEMES).toHaveLength(8)
    expect(new Set(TILE_THEMES.map((item) => item.id)).size).toBe(8)
    expect(TILE_THEMES.filter((item) => item.id.startsWith('checker')).length).toBe(4)
  })

  it('모든 디자인이 3×3~6×6의 모든 타일에 배경색과 글자색을 정한다', () => {
    for (const item of TILE_THEMES) {
      for (const size of [3, 4, 5, 6]) {
        for (let tile = 1; tile < size * size; tile++) {
          const { background, color } = tileColors(item, tile, size)
          expect(background).toMatch(/^hsl\(/)
          expect(color).toMatch(/^#[0-9a-f]{6}$/)
        }
      }
    }
  })
})

describe('tileColors', () => {
  it('그라데이션은 왼쪽 위와 마지막 칸 근처의 색이 다르고, 같은 대각선은 같은 색이다', () => {
    const pastel = theme('pastel')
    expect(tileColors(pastel, 1, 3).background).toBe('hsl(195 85% 86%)')
    expect(tileColors(pastel, 8, 3).background).not.toBe(tileColors(pastel, 1, 3).background)
    // 3×3: 타일 2(1행 2열)와 타일 4(2행 1열)는 같은 대각선
    expect(tileColors(pastel, 2, 3)).toEqual(tileColors(pastel, 4, 3))
  })

  it('체크무늬는 이웃한 칸끼리 색이 다르고, 한 칸 건너면 같다', () => {
    const lemonSky = theme('checker-lemon-sky')
    expect(tileColors(lemonSky, 1, 4)).not.toEqual(tileColors(lemonSky, 2, 4)) // 오른쪽 이웃
    expect(tileColors(lemonSky, 1, 4)).not.toEqual(tileColors(lemonSky, 5, 4)) // 아래 이웃
    expect(tileColors(lemonSky, 1, 4)).toEqual(tileColors(lemonSky, 6, 4)) // 대각선
  })

  it('줄무늬는 가로 줄마다 색이 바뀐다', () => {
    const rows = theme('rows')
    const hue = (tile: number) => tileColors(rows, tile, 4).background.split(' ')[0]
    expect(hue(1)).toBe(hue(4)) // 같은 줄
    expect(hue(1)).not.toBe(hue(5)) // 다음 줄
  })

  it('어두운 칸(클래식 체스판 남색)에는 흰 글자를 쓴다', () => {
    expect(tileColors(theme('checker-classic'), 2, 4).color).toBe('#f8fafc')
  })
})

describe('pickTheme', () => {
  it('난수에 따라 디자인을 고른다', () => {
    expect(pickTheme(null, () => 0).id).toBe(TILE_THEMES[0]!.id)
    expect(pickTheme(null, () => 0.999).id).toBe(TILE_THEMES.at(-1)!.id)
  })

  it('바로 전 판과 같은 디자인은 고르지 않는다', () => {
    for (const previous of TILE_THEMES) {
      for (const value of [0, 0.25, 0.5, 0.75, 0.999]) {
        expect(pickTheme(previous.id, () => value).id).not.toBe(previous.id)
      }
    }
  })
})
