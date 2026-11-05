// 지원하는 판 크기. 크기를 추가할 때는 이 배열만 고친다.
export const SIZES = [3, 4, 5] as const

export type Size = (typeof SIZES)[number]
