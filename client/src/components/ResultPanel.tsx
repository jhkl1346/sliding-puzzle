import { useEffect, useRef } from 'react'
import { formatTime } from '../lib/formatTime'

interface ResultPanelProps {
  moves: number
  timeMs: number
  onRestart: () => void
}

export function ResultPanel({ moves, timeMs, onRestart }: ResultPanelProps) {
  const restartRef = useRef<HTMLButtonElement>(null)

  // 완성 화면이 뜨면 "다시 하기" 버튼으로 초점을 옮겨, 키보드로 바로 이어서 할 수 있게 한다.
  useEffect(() => {
    restartRef.current?.focus()
  }, [])

  return (
    <section
      aria-labelledby="result-title"
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/90 text-center backdrop-blur-sm"
    >
      <h2 id="result-title" className="text-3xl font-bold">
        완성했어요!
      </h2>
      <p className="text-lg text-slate-700">
        {moves}번 이동 · {formatTime(timeMs)}
      </p>
      <button
        ref={restartRef}
        type="button"
        onClick={onRestart}
        className="cursor-pointer rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800 focus-visible:ring-4 focus-visible:ring-sky-300 focus-visible:outline-none"
      >
        다시 하기
      </button>
    </section>
  )
}
