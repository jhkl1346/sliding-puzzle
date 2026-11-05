import type { StatsResponse, TrendPoint } from '@sliding-puzzle/shared'
import { useId, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatShortDate } from '../../lib/formatDate'
import { formatTime } from '../../lib/formatTime'

// 앱의 주 색상(sky-700). 흰 배경에서 대비 검사를 통과한 색이다.
const SERIES_COLOR = '#0369a1'
const AXIS_COLOR = '#475569' // slate-600
const GRID_COLOR = '#e2e8f0' // slate-200

const METRICS = {
  moves: {
    label: '평균 이동',
    value: (point: TrendPoint) => point.averageMoves,
    format: (value: number) => `${Math.round(value)}번`,
  },
  time: {
    label: '평균 시간',
    value: (point: TrendPoint) => point.averageTimeMs,
    format: (value: number) => formatTime(value),
  },
} as const

type Metric = keyof typeof METRICS

const toggleClass =
  'cursor-pointer rounded-lg border-2 border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:border-sky-500 focus-visible:ring-4 focus-visible:ring-sky-500 focus-visible:outline-none aria-pressed:border-sky-700 aria-pressed:bg-sky-700 aria-pressed:text-white'

function ToggleGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={toggleClass}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: { payload: TrendPoint }[]
  metric: Metric
}

function ChartTooltip({ active, payload, metric }: ChartTooltipProps) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const value = METRICS[metric].value(point)
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold">{formatShortDate(point.date)}</p>
      <p>
        {METRICS[metric].label}: {value === null ? '기록 없음' : METRICS[metric].format(value)}
      </p>
      <p className="text-slate-600">{point.games}판 완료</p>
    </div>
  )
}

export function TrendChart({ trend }: { trend: StatsResponse['trend'] }) {
  const titleId = useId()
  const [size, setSize] = useState(trend[0]?.size ?? 3)
  const [metric, setMetric] = useState<Metric>('moves')
  const points = trend.find((item) => item.size === size)?.points ?? []
  const hasData = points.some((point) => point.games > 0)
  const { label, value, format } = METRICS[metric]

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={titleId} className="font-bold">
          최근 7일 {size}×{size} {label}
        </h3>
        <div className="flex flex-wrap gap-2">
          <ToggleGroup
            label="추이를 볼 판 크기"
            options={trend.map((item) => ({
              value: item.size,
              label: `${item.size}×${item.size}`,
            }))}
            value={size}
            onChange={setSize}
          />
          <ToggleGroup
            label="추이 지표"
            options={[
              { value: 'moves' as const, label: '이동' },
              { value: 'time' as const, label: '시간' },
            ]}
            value={metric}
            onChange={setMetric}
          />
        </div>
      </div>

      {hasData ? (
        // 그래프는 눈으로 보는 용도이고, 같은 값을 아래 표로도 제공한다.
        <div aria-hidden="true" className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                stroke={AXIS_COLOR}
                tickLine={false}
                fontSize={12}
              />
              <YAxis
                stroke={AXIS_COLOR}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={56}
                tickFormatter={(tick: number) => format(tick)}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={<ChartTooltip metric={metric} />}
                cursor={{ stroke: AXIS_COLOR, strokeDasharray: '4 4' }}
              />
              <Line
                type="monotone"
                dataKey={(point: TrendPoint) => value(point)}
                stroke={SERIES_COLOR}
                strokeWidth={2}
                dot={{ r: 4, fill: SERIES_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: SERIES_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-600">
          최근 7일 동안 완료한 {size}×{size} 게임이 없어요.
        </p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-sky-700">표로 보기</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <caption className="sr-only">
            최근 7일 {size}×{size} 날짜별 기록
          </caption>
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th scope="col" className="py-1 font-medium">
                날짜
              </th>
              <th scope="col" className="py-1 font-medium">
                완료
              </th>
              <th scope="col" className="py-1 font-medium">
                {label}
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => {
              const pointValue = value(point)
              return (
                <tr key={point.date} className="border-b border-slate-100">
                  <th scope="row" className="py-1 font-normal">
                    {formatShortDate(point.date)}
                  </th>
                  <td className="py-1">{point.games}판</td>
                  <td className="py-1">{pointValue === null ? '-' : format(pointValue)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </details>
    </section>
  )
}
