import type { SizeStats } from '@sliding-puzzle/shared'
import { formatPercent } from '../../lib/formatDate'
import { formatTime } from '../../lib/formatTime'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
    </div>
  )
}

function SizeCard({ stats }: { stats: SizeStats }) {
  const { size, completed, attempted, completionRate, best, average } = stats
  const title = `${size}×${size}`

  return (
    <section
      aria-labelledby={`best-${size}`}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <h3 id={`best-${size}`} className="font-bold">
        {title}
      </h3>
      {completed === 0 ? (
        <p className="text-sm text-slate-600">아직 완료한 게임이 없어요.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="최소 이동" value={`${best.moves}번`} />
          <Stat label="최단 시간" value={formatTime(best.timeMs!)} />
          <Stat label="평균 이동" value={`${Math.round(average.moves!)}번`} />
          <Stat label="평균 시간" value={formatTime(average.timeMs!)} />
        </dl>
      )}
      {completionRate !== null && (
        <p className="text-sm text-slate-700">
          완료율 <span className="font-semibold">{formatPercent(completionRate)}</span>{' '}
          <span className="text-slate-600">
            ({completed}/{attempted}판)
          </span>
        </p>
      )}
    </section>
  )
}

export function BestCards({ sizes }: { sizes: SizeStats[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {sizes.map((stats) => (
        <SizeCard key={stats.size} stats={stats} />
      ))}
    </div>
  )
}
