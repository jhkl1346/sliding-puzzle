// 밀리초를 "분:초.(0.1초 단위)" 형식으로 바꾼다. 예: 61234 → "01:01.2"
export function formatTime(ms: number): string {
  const tenths = Math.floor(ms / 100)
  const minutes = Math.floor(tenths / 600)
  const seconds = Math.floor((tenths % 600) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths % 10}`
}
