import type { StatsResponse } from '@sliding-puzzle/shared'
import { apiRequest } from './client'

// 날짜를 내 시간대 기준으로 나누도록 브라우저의 시간대를 함께 보낸다.
export function fetchStats(timeZone: string): Promise<StatsResponse> {
  return apiRequest<StatsResponse>(`/api/stats?tz=${encodeURIComponent(timeZone)}`)
}
