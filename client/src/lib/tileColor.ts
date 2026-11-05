// 타일 배경색: 완성 상태에서 그 타일이 있을 자리에 따라 정한다.
// 왼쪽 위는 하늘색, 오른쪽 아래로 갈수록 보라를 지나 분홍으로 바뀌어서,
// 다 맞추면 판 전체가 대각선 그라데이션이 되고 색으로도 타일의 자리를 짐작할 수 있다.
// 배경은 밝은 파스텔이라 진한 숫자(slate-900)와의 명도 대비가 충분하다.

const START_HUE = 195 // 하늘색
const END_HUE = 330 // 분홍

export function tileHue(tile: number, size: number): number {
  const home = tile - 1 // 타일 n은 완성 상태에서 n-1번째 칸에 있다.
  const row = Math.floor(home / size)
  const col = home % size
  const progress = size > 1 ? (row + col) / (2 * (size - 1)) : 0
  return Math.round(START_HUE + (END_HUE - START_HUE) * progress)
}

export function tileColor(tile: number, size: number): string {
  return `hsl(${tileHue(tile, size)} 85% 86%)`
}
