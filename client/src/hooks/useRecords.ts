import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteGame, listGames } from '../api/games'
import { fetchStats } from '../api/stats'

// 기록이 바뀌면(저장·삭제) 이 키로 시작하는 캐시를 모두 다시 불러온다.
const RECORDS_KEY = 'records'

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function useStats() {
  const timeZone = browserTimeZone()
  return useQuery({
    queryKey: [RECORDS_KEY, 'stats', timeZone],
    queryFn: () => fetchStats(timeZone),
  })
}

export function useGameList(page: number) {
  return useQuery({
    queryKey: [RECORDS_KEY, 'games', page],
    queryFn: () => listGames(page),
    // 페이지를 넘기는 동안 이전 페이지를 보여 줘서 화면이 깜빡이지 않게 한다.
    placeholderData: keepPreviousData,
  })
}

export function useInvalidateRecords() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [RECORDS_KEY] })
}

export function useDeleteGame() {
  const invalidateRecords = useInvalidateRecords()
  return useMutation({ mutationFn: deleteGame, onSuccess: invalidateRecords })
}
