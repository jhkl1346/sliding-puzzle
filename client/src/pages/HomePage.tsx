import { useMe } from '../hooks/useAuth'
import { GamePage } from './GamePage'

// 로그인했으면 기록 모드, 아니면 연습 모드로 게임을 보여 준다.
export function HomePage() {
  const me = useMe()

  if (me.isPending) {
    return (
      <main className="mx-auto flex max-w-md justify-center px-4 py-10">
        <p role="status" className="text-slate-600">
          불러오는 중…
        </p>
      </main>
    )
  }

  // 로그인·로그아웃하면 게임을 새로 시작한다. (서버를 쓸 수 없으면 연습 모드로 플레이)
  return <GamePage key={me.data?.id ?? 'guest'} recordMode={Boolean(me.data)} />
}
