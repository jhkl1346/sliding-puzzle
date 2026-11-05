import { Link } from 'react-router'
import { useLogout, useMe } from '../hooks/useAuth'

const linkClass =
  'rounded-lg px-3 py-2 font-semibold text-sky-700 hover:bg-sky-50 focus-visible:ring-4 focus-visible:ring-sky-500 focus-visible:outline-none'

export function Header() {
  const me = useMe()
  const logout = useLogout()

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        aria-label="주 메뉴"
        className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2"
      >
        <Link to="/" className="font-bold text-slate-900">
          Sliding Puzzle
        </Link>

        {/* 로그인 상태를 확인하는 동안에는 자리만 차지해서 화면이 흔들리지 않게 한다. */}
        <div className="flex min-h-10 items-center gap-1 text-sm">
          {me.data ? (
            <>
              <span className="px-2 text-slate-700">{me.data.username}님</span>
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className={`${linkClass} cursor-pointer`}
              >
                로그아웃
              </button>
            </>
          ) : (
            me.data === null && (
              <>
                <Link to="/login" className={linkClass}>
                  로그인
                </Link>
                <Link to="/register" className={linkClass}>
                  회원가입
                </Link>
              </>
            )
          )}
        </div>
      </nav>
    </header>
  )
}
