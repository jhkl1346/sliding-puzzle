import type { FinishResult } from '@sliding-puzzle/shared'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { formatTime } from '../lib/formatTime'

export interface SaveState {
  status: 'idle' | 'pending' | 'success' | 'error'
  result: FinishResult | undefined
  error: Error | null
  retry: () => void
}

interface ResultPanelProps {
  moves: number
  timeMs: number
  onRestart: () => void
  // 기록 모드의 저장 상태. 연습 모드면 null.
  save: SaveState | null
  onLoginAgain: () => void
}

const buttonClass =
  'cursor-pointer rounded-lg px-3 py-1 font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900'

function SaveMessage({ save, onLoginAgain }: { save: SaveState; onLoginAgain: () => void }) {
  if (save.status === 'success' && save.result) {
    const { newBest } = save.result
    return (
      <>
        <p>기록을 저장했어요.</p>
        {newBest.moves && <p className="font-bold text-emerald-800">🏆 최소 이동 기록 달성!</p>}
        {newBest.time && <p className="font-bold text-emerald-800">⏱️ 최단 시간 기록 달성!</p>}
      </>
    )
  }

  if (save.status === 'error') {
    if (save.error instanceof ApiError && save.error.status === 401) {
      return (
        <>
          <p className="text-red-800">로그인이 만료돼서 기록을 저장하지 못했어요.</p>
          <button type="button" onClick={onLoginAgain} className={buttonClass}>
            다시 로그인하기
          </button>
        </>
      )
    }
    return (
      <>
        <p className="text-red-800">{save.error?.message ?? '기록을 저장하지 못했어요.'}</p>
        <button type="button" onClick={save.retry} className={buttonClass}>
          저장 다시 시도
        </button>
      </>
    )
  }

  return <p>기록을 저장하는 중…</p>
}

export function ResultPanel({ moves, timeMs, onRestart, save, onLoginAgain }: ResultPanelProps) {
  const restartRef = useRef<HTMLButtonElement>(null)

  // 완성 화면이 뜨면 "다시 하기" 버튼으로 초점을 옮겨, 키보드로 바로 이어서 할 수 있게 한다.
  useEffect(() => {
    restartRef.current?.focus()
  }, [])

  return (
    <section
      aria-labelledby="result-title"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/90 px-4 text-center backdrop-blur-sm"
    >
      <h2 id="result-title" className="text-3xl font-bold">
        완성했어요!
      </h2>
      <p className="text-lg text-slate-700">
        {moves}번 이동 · {formatTime(timeMs)}
      </p>

      {/* 저장 결과는 화면 읽기 프로그램에도 알려준다. */}
      <div role="status" className="flex flex-col items-center gap-1 text-sm">
        {save ? (
          <SaveMessage save={save} onLoginAgain={onLoginAgain} />
        ) : (
          <p className="text-slate-600">
            <Link to="/login" className="font-semibold text-sky-700 underline underline-offset-2">
              로그인
            </Link>
            하면 기록이 저장돼요.
          </p>
        )}
      </div>

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
