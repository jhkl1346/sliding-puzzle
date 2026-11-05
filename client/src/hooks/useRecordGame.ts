import type { Size } from '@sliding-puzzle/shared'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { abandonGame, createGame, finishGame } from '../api/games'
import type { useGame } from './useGame'
import { useInvalidateRecords } from './useRecords'

type Game = ReturnType<typeof useGame>

// 기록 모드: 서버에서 시드를 받아 시작하고, 다 풀면 이동 기록을 제출한다.
// enabled가 false(연습 모드)면 서버를 쓰지 않고 브라우저에서만 섞는다.
export function useRecordGame(enabled: boolean, game: Game, initialSize: Size) {
  const { state, finished, begin, start: startPractice } = game

  const create = useMutation({ mutationFn: createGame })
  const invalidateRecords = useInvalidateRecords()
  const finish = useMutation({
    mutationFn: ({ id, ...body }: { id: string; moveLog: number[]; timeMs: number }) =>
      finishGame(id, body),
    // 새 기록이 생겼으니 내 기록 페이지의 통계·목록을 다시 불러오게 한다.
    onSuccess: invalidateRecords,
  })
  const abandon = useMutation({ mutationFn: abandonGame })

  const start = useCallback(
    (size: Size) => {
      if (!enabled) {
        startPractice(size)
        return
      }
      // 풀던 게임이 있으면 포기로 기록한다. (실패해도 새 게임은 시작한다)
      if (state.serverGameId && !finished) abandon.mutate(state.serverGameId)
      finish.reset()
      create.mutate(size, { onSuccess: (started) => begin(started.size, started.seed, started.id) })
    },
    [enabled, state.serverGameId, finished, startPractice, begin, abandon, finish, create],
  )

  // 처음 화면에 들어오면 서버 게임을 하나 만든다. (개발 모드에서 effect가 두 번 돌아도 한 번만)
  const initialized = useRef(false)
  useEffect(() => {
    if (!enabled || initialized.current) return
    initialized.current = true
    start(initialSize)
  }, [enabled, initialSize, start])

  // 다 풀면 한 번만 제출한다.
  const submittedFor = useRef<string | null>(null)
  useEffect(() => {
    const id = state.serverGameId
    if (!enabled || !finished || !id || submittedFor.current === id) return
    submittedFor.current = id
    finish.mutate({ id, moveLog: state.moveLog, timeMs: state.finishedAt! - state.startedAt! })
  }, [enabled, finished, state, finish])

  return {
    start,
    // 서버 게임을 받아서 플레이할 수 있는 상태인지
    ready: !enabled || (create.isSuccess && state.serverGameId === create.data.id),
    // 준비 중에 고른 크기를 바로 보여 주기 위해
    size: enabled ? (create.variables ?? state.size) : state.size,
    prepare: {
      pending: create.isPending,
      error: create.error,
      retry: () => start(create.variables ?? state.size),
    },
    save: enabled
      ? {
          status: finish.status,
          result: finish.data,
          error: finish.error,
          retry: () => finish.variables && finish.mutate(finish.variables),
        }
      : null,
  }
}
