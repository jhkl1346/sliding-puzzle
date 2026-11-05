// "2026-11-05" → "11/5" (차트 가로축)
export function formatShortDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

// ISO 시각 → "11월 5일 오후 2:30" (기록 목록)
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

// 0.5 → "50%"
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
