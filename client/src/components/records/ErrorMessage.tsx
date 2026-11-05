import { ApiError } from '../../api/client'
import { useLoginAgain } from '../../hooks/useAuth'

const buttonClass =
  'cursor-pointer rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:ring-4 focus-visible:ring-sky-300 focus-visible:outline-none'

// 불러오기 실패: 원인 메시지와 함께 다시 시도(또는 로그인 만료 시 다시 로그인)를 보여 준다.
export function ErrorMessage({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const loginAgain = useLoginAgain()
  const loginExpired = error instanceof ApiError && error.status === 401

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 px-4 py-6 text-center">
      <p role="alert" className="text-sm font-medium text-red-800">
        {loginExpired ? '로그인이 만료됐어요. 다시 로그인해 주세요.' : error.message}
      </p>
      <button type="button" onClick={loginExpired ? loginAgain : onRetry} className={buttonClass}>
        {loginExpired ? '다시 로그인하기' : '다시 시도'}
      </button>
    </div>
  )
}
