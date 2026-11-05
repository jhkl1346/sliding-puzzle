import { useEffect, useState } from 'react'

// 시작 시각부터 지난 시간(ms). 끝났으면 걸린 시간에서 멈춘다.
export function useElapsedTime(startedAt: number | null, finishedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  const running = startedAt !== null && finishedAt === null

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [running])

  if (startedAt === null) return 0
  return Math.max(0, (finishedAt ?? now) - startedAt)
}
