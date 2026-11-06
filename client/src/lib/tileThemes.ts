// 타일 색 디자인. 색은 지금 놓인 위치가 아니라 "완성 상태에서 그 타일이 있을 자리"로 정한다.
// 그래서 다 맞추면 판 전체에 무늬가 완성되고, 섞여 있을 때는 색이 자리 힌트가 된다.
// 배경은 밝은 색에는 진한 글자, 어두운 색(클래식 체스판 남색)에는 흰 글자를 써서 숫자가 잘 보이게 한다.

export interface TileColors {
  background: string
  color: string
}

export interface TileTheme {
  id: string
  name: string
  // row, col: 완성 상태에서의 칸 위치 (0부터), size: 판 크기
  paint: (row: number, col: number, size: number) => TileColors
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

// 왼쪽 위(0)에서 오른쪽 아래(1)까지 대각선으로 얼마나 왔는지
function diagonal(row: number, col: number, size: number): number {
  return size > 1 ? (row + col) / (2 * (size - 1)) : 0
}

function checker(light: TileColors, dark: TileColors): TileTheme['paint'] {
  return (row, col) => ((row + col) % 2 === 0 ? light : dark)
}

export const TILE_THEMES: TileTheme[] = [
  {
    id: 'pastel',
    name: '파스텔',
    paint: (row, col, size) => ({
      background: `hsl(${Math.round(lerp(195, 330, diagonal(row, col, size)))} 85% 86%)`,
      color: '#0f172a',
    }),
  },
  {
    id: 'ocean',
    name: '바다',
    paint: (row, col, size) => {
      const progress = diagonal(row, col, size)
      const lightness = Math.round(lerp(90, 62, progress))
      return {
        background: `hsl(${Math.round(lerp(170, 215, progress))} 70% ${lightness}%)`,
        color: lightness < 70 ? '#042f2e' : '#083344',
      }
    },
  },
  {
    id: 'sunset',
    name: '노을',
    paint: (row, col, size) => ({
      // 노랑(50) → 주황 → 붉은 분홍(-20 = 340)
      background: `hsl(${(Math.round(lerp(50, -20, diagonal(row, col, size))) + 360) % 360} 90% 82%)`,
      color: '#431407',
    }),
  },
  {
    id: 'rows',
    name: '줄무늬',
    paint: (row, col, size) => {
      // 가로 줄마다 다른 색, 같은 줄에서는 오른쪽으로 갈수록 진하게
      const hues = [8, 40, 155, 250, 320]
      const hue = hues[row % hues.length]!
      const lightness = Math.round(lerp(88, 74, size > 1 ? col / (size - 1) : 0))
      return { background: `hsl(${hue} 75% ${lightness}%)`, color: '#1e1b4b' }
    },
  },
  {
    id: 'checker-lemon-sky',
    name: '체크무늬 레몬·하늘',
    paint: checker(
      { background: 'hsl(48 95% 80%)', color: '#422006' },
      { background: 'hsl(190 80% 82%)', color: '#083344' },
    ),
  },
  {
    id: 'checker-strawberry-mint',
    name: '체크무늬 딸기우유·민트',
    paint: checker(
      { background: 'hsl(345 85% 88%)', color: '#500724' },
      { background: 'hsl(160 60% 80%)', color: '#052e16' },
    ),
  },
  {
    id: 'checker-lavender-peach',
    name: '체크무늬 라벤더·피치',
    paint: checker(
      { background: 'hsl(265 75% 88%)', color: '#2e1065' },
      { background: 'hsl(25 95% 84%)', color: '#431407' },
    ),
  },
  {
    id: 'checker-classic',
    name: '클래식 체스판',
    paint: checker(
      { background: 'hsl(40 60% 90%)', color: '#1e293b' },
      { background: 'hsl(222 45% 30%)', color: '#f8fafc' },
    ),
  },
]

// 타일 번호 n은 완성 상태에서 n-1번째 칸에 있다.
export function tileColors(theme: TileTheme, tile: number, size: number): TileColors {
  const home = tile - 1
  return theme.paint(Math.floor(home / size), home % size, size)
}

// 새 게임에 쓸 디자인을 무작위로 고른다. 바로 전 판과 같은 디자인은 고르지 않는다.
export function pickTheme(
  previousId: string | null,
  random: () => number = Math.random,
): TileTheme {
  const candidates = TILE_THEMES.filter((theme) => theme.id !== previousId)
  return candidates[Math.floor(random() * candidates.length)] ?? TILE_THEMES[0]!
}
