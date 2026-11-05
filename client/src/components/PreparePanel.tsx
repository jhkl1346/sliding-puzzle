import { ApiError } from '../api/client'

interface PreparePanelProps {
  error: Error | null
  onRetry: () => void
  onLoginAgain: () => void
}

const buttonClass =
  'cursor-pointer rounded-lg bg-sky-700 px-5 py-2 font-semibold text-white hover:bg-sky-800 focus-visible:ring-4 focus-visible:ring-sky-300 focus-visible:outline-none'

// 기록 모드에서 서버가 새 퍼즐(시드)을 정해 주는 동안 판 위에 덮어 보여 준다.
export function PreparePanel({ error, onRetry, onLoginAgain }: PreparePanelProps) {
  const loginExpired = error instanceof ApiError && error.status === 401

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/90 px-4 text-center backdrop-blur-sm">
      {error ? (
        <>
          <p role="alert" className="font-medium text-red-800">
            {loginExpired
              ? '로그인이 만료됐어요. 다시 로그인해 주세요.'
              : `새 퍼즐을 받지 못했어요. ${error.message}`}
          </p>
          <button
            type="button"
            onClick={loginExpired ? onLoginAgain : onRetry}
            className={buttonClass}
          >
            {loginExpired ? '다시 로그인하기' : '다시 시도'}
          </button>
        </>
      ) : (
        <p role="status" className="font-medium text-slate-700">
          새 퍼즐을 준비하는 중…
        </p>
      )}
    </div>
  )
}
