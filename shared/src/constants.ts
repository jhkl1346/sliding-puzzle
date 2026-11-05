// 지원하는 판 크기. 크기를 추가할 때는 이 파일만 고친다.
export const SIZES = [3, 4, 5] as const

export type Size = (typeof SIZES)[number]

// 크기별로 완성 상태에서 몇 번 이동해서 섞을지. SIZES에 크기를 추가하면 여기도 채우라고 타입 검사가 알려준다.
export const SHUFFLE_MOVES: Record<Size, number> = {
  3: 80,
  4: 150,
  5: 250,
}

export function isSize(value: number): value is Size {
  return (SIZES as readonly number[]).includes(value)
}
