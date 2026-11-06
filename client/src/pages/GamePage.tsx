import type { Direction, Size } from '@sliding-puzzle/shared'
import { useEffect } from 'react'
import { Board } from '../components/Board'
import { GameStats } from '../components/GameStats'
import { PreparePanel } from '../components/PreparePanel'
import { ResultPanel } from '../components/ResultPanel'
import { SizeSelector } from '../components/SizeSelector'
import { useLoginAgain } from '../hooks/useAuth'
import { useElapsedTime } from '../hooks/useElapsedTime'
import { useGame } from '../hooks/useGame'
import { useRecordGame } from '../hooks/useRecordGame'
import { useTileTheme } from '../hooks/useTileTheme'
import { randomSeed as defaultRandomSeed } from '../lib/randomSeed'

const DEFAULT_SIZE: Size = 3

const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

interface GamePageProps {
  // 로그인한 사용자: 서버에서 시드를 받고, 다 풀면 기록을 저장한다.
  recordMode?: boolean
  // 연습 모드 테스트에서 같은 퍼즐이 나오게 시드를 고정할 수 있다.
  randomSeed?: () => number
  // 테스트에서 같은 색 디자인이 나오게 고정할 수 있다.
  themeRandom?: () => number
}

export function GamePage({
  recordMode = false,
  randomSeed = defaultRandomSeed,
  themeRandom = Math.random,
}: GamePageProps) {
  const game = useGame(DEFAULT_SIZE, randomSeed)
  const { state, finished, moveTile, moveInDirection } = game
  const record = useRecordGame(recordMode, game, DEFAULT_SIZE)
  const theme = useTileTheme(state.gameId, themeRandom)
  const loginAgain = useLoginAgain()
  const elapsedMs = useElapsedTime(state.startedAt, state.finishedAt)
  const playable = record.ready && !finished

  useEffect(() => {
    if (!playable) return

    function handleKeyDown(event: KeyboardEvent) {
      const direction = ARROW_KEYS[event.key]
      if (!direction || event.altKey || event.ctrlKey || event.metaKey) return
      event.preventDefault() // 방향키로 페이지가 스크롤되지 않게 한다.
      moveInDirection(direction)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playable, moveInDirection])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Sliding Puzzle</h1>
        <p className="mt-1 text-sm text-slate-600">
          {recordMode
            ? '기록 모드 · 다 풀면 기록이 저장돼요'
            : '연습 모드 · 기록은 저장되지 않아요'}
        </p>
      </header>

      <SizeSelector value={record.size} onChange={record.start} />
      <GameStats moves={state.moveLog.length} elapsedMs={elapsedMs} />

      {/* 새 게임마다 key를 바꿔 판을 새로 그린다. (타일이 이전 판 자리에서 미끄러져 오지 않게) */}
      <Board
        key={state.gameId}
        board={state.board}
        size={state.size}
        disabled={!playable}
        theme={theme}
        showStartHint={!finished}
        onMove={moveTile}
      >
        {!record.ready && (
          <PreparePanel
            error={record.prepare.error}
            onRetry={record.prepare.retry}
            onLoginAgain={loginAgain}
          />
        )}
      </Board>

      {record.ready && finished && (
        <ResultPanel
          moves={state.moveLog.length}
          timeMs={elapsedMs}
          onRestart={() => record.start(state.size)}
          save={record.save}
          onLoginAgain={loginAgain}
        />
      )}

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => record.start(record.size)}
          disabled={record.prepare.pending}
          className="cursor-pointer rounded-lg px-4 py-2 font-semibold text-sky-700 hover:bg-sky-50 focus-visible:ring-4 focus-visible:ring-sky-500 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
        >
          새로 섞기
        </button>
        <p className="text-center text-sm text-slate-600">
          빈칸 옆 타일을 누르거나 방향키로 움직여요. 첫 이동부터 시간을 재요.
        </p>
      </div>
    </main>
  )
}
