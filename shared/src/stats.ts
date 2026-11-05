// GET /api/stats 응답 타입과 기준

// 시작한 지 이만큼 지나도 끝나지 않은 게임은 포기한 것으로 본다. (새로고침·창 닫기로 남은 게임)
export const STALE_GAME_MS = 60 * 60 * 1000 // 1시간
// 추이 차트에 보여 줄 기간 (오늘 포함)
export const TREND_DAYS = 7

export interface SizeStats {
  size: number
  // 완료한 게임 수
  completed: number
  // 완료율 계산에 넣은 게임 수 = 완료 + 포기 + 오래 방치된 진행 중
  attempted: number
  // 완료 / attempted (시도한 게임이 없으면 null)
  completionRate: number | null
  best: { moves: number | null; timeMs: number | null }
  average: { moves: number | null; timeMs: number | null }
}

// 하루치 추이 (그날 완료한 게임이 없으면 평균은 null)
export interface TrendPoint {
  date: string // YYYY-MM-DD (요청한 시간대 기준)
  games: number
  averageMoves: number | null
  averageTimeMs: number | null
}

export interface StatsResponse {
  timeZone: string
  sizes: SizeStats[]
  // 크기별 최근 TREND_DAYS일 추이 (오래된 날짜부터)
  trend: { size: number; points: TrendPoint[] }[]
}
