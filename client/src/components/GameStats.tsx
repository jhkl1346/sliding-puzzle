import { formatTime } from '../lib/formatTime'

interface GameStatsProps {
  moves: number
  elapsedMs: number
}

export function GameStats({ moves, elapsedMs }: GameStatsProps) {
  return (
    <>
      <dl className="flex gap-8 text-center">
        <div>
          <dt className="text-sm text-slate-600">이동</dt>
          <dd className="text-2xl font-bold tabular-nums">{moves}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">시간</dt>
          <dd className="text-2xl font-bold tabular-nums">{formatTime(elapsedMs)}</dd>
        </div>
      </dl>
      {/* 화면 읽기 프로그램에는 이동 횟수만 알려준다. (시간까지 읽으면 너무 시끄러움) */}
      <p role="status" className="sr-only">
        이동 {moves}회
      </p>
    </>
  )
}
