import { Link, Navigate } from 'react-router'
import { BestCards } from '../components/records/BestCards'
import { ErrorMessage } from '../components/records/ErrorMessage'
import { RecentGames } from '../components/records/RecentGames'
import { TrendChart } from '../components/records/TrendChart'
import { useMe } from '../hooks/useAuth'
import { useStats } from '../hooks/useRecords'

function Loading({ children }: { children: string }) {
  return (
    <p role="status" className="py-10 text-center text-slate-600">
      {children}
    </p>
  )
}

function RecordsContent() {
  const stats = useStats()

  if (stats.isPending) return <Loading>기록을 불러오는 중…</Loading>
  if (stats.isError) return <ErrorMessage error={stats.error} onRetry={() => stats.refetch()} />

  const totalCompleted = stats.data.sizes.reduce((sum, size) => sum + size.completed, 0)
  if (totalCompleted === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
        <p className="text-lg font-semibold">아직 기록이 없어요.</p>
        <p className="text-slate-600">첫 게임을 해 보세요. 다 풀면 여기에 기록이 쌓여요.</p>
        <Link
          to="/"
          className="rounded-lg bg-sky-700 px-5 py-2 font-semibold text-white hover:bg-sky-800 focus-visible:ring-4 focus-visible:ring-sky-300 focus-visible:outline-none"
        >
          게임하러 가기
        </Link>
      </div>
    )
  }

  return (
    <>
      <section aria-labelledby="best-title" className="flex flex-col gap-3">
        <h2 id="best-title" className="text-xl font-bold">
          크기별 최고 기록
        </h2>
        <BestCards sizes={stats.data.sizes} />
      </section>

      <section aria-labelledby="trend-title" className="flex flex-col gap-3">
        <h2 id="trend-title" className="text-xl font-bold">
          성장 추이
        </h2>
        <TrendChart trend={stats.data.trend} />
      </section>

      <section aria-labelledby="recent-title" className="flex flex-col gap-3">
        <h2 id="recent-title" className="text-xl font-bold">
          최근 기록
        </h2>
        <RecentGames />
      </section>
    </>
  )
}

export function RecordsPage() {
  const me = useMe()

  if (me.isPending) return <Loading>불러오는 중…</Loading>
  // 내 기록은 로그인해야 볼 수 있다.
  if (!me.data) return <Navigate to="/login" replace />

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold">내 기록</h1>
      <RecordsContent />
    </main>
  )
}
