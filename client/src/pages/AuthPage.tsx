import { Link, Navigate, useNavigate } from 'react-router'
import { AuthForm } from '../components/AuthForm'
import { useLogin, useMe, useRegister } from '../hooks/useAuth'

interface AuthPageProps {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const me = useMe()
  const login = useLogin()
  const register = useRegister()
  const mutation = mode === 'login' ? login : register
  const isRegister = mode === 'register'

  // 이미 로그인했으면 게임 화면으로 보낸다.
  if (me.data) return <Navigate to="/" replace />

  return (
    <main className="mx-auto flex max-w-sm flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{isRegister ? '회원가입' : '로그인'}</h1>
      <p className="text-center text-sm text-slate-600">
        {isRegister
          ? '가입하면 내 기록을 저장하고 성장 통계를 볼 수 있어요.'
          : '로그인하면 플레이 기록이 저장돼요.'}
      </p>

      <AuthForm
        // 로그인↔회원가입을 오갈 때 입력과 오류를 새로 시작한다.
        key={mode}
        mode={mode}
        submitting={mutation.isPending}
        serverError={mutation.error?.message ?? null}
        onSubmit={(credentials) =>
          mutation.mutate(credentials, { onSuccess: () => navigate('/', { replace: true }) })
        }
      />

      <p className="text-sm text-slate-600">
        {isRegister ? '이미 계정이 있나요? ' : '처음이신가요? '}
        <Link
          to={isRegister ? '/login' : '/register'}
          className="font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900"
        >
          {isRegister ? '로그인' : '회원가입'}
        </Link>
      </p>
    </main>
  )
}
