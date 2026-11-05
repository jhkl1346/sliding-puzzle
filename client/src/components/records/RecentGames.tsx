import { useState } from 'react'
import { useDeleteGame, useGameList } from '../../hooks/useRecords'
import { formatDateTime } from '../../lib/formatDate'
import { formatTime } from '../../lib/formatTime'
import { ErrorMessage } from './ErrorMessage'

const pageButtonClass =
  'cursor-pointer rounded-lg px-3 py-1 font-semibold text-sky-700 hover:bg-sky-50 focus-visible:ring-4 focus-visible:ring-sky-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent'

export function RecentGames() {
  const [page, setPage] = useState(1)
  const list = useGameList(page)
  const remove = useDeleteGame()

  if (list.isPending) {
    return (
      <p role="status" className="py-6 text-center text-slate-600">
        기록을 불러오는 중…
      </p>
    )
  }
  if (list.isError) {
    return <ErrorMessage error={list.error} onRetry={() => list.refetch()} />
  }

  const { games, total, pageSize } = list.data
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  // 마지막 페이지의 기록을 다 지우면 앞 페이지로 돌아간다.
  if (games.length === 0 && page > 1) {
    setPage(lastPage)
    return null
  }

  function handleDelete(id: string, label: string) {
    if (!window.confirm(`${label} 기록을 삭제할까요? 되돌릴 수 없어요.`)) return
    remove.mutate(id)
  }

  return (
    <div className="flex flex-col gap-2">
      {remove.isError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          삭제하지 못했어요. {remove.error.message}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm tabular-nums">
          <caption className="sr-only">최근 완료한 게임 기록</caption>
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th scope="col" className="py-2 pr-3 font-medium">
                날짜
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                크기
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                이동
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                시간
              </th>
              <th scope="col" className="py-2 font-medium">
                <span className="sr-only">삭제</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => {
              const when = formatDateTime(game.finishedAt)
              const label = `${when} ${game.size}×${game.size}`
              return (
                <tr key={game.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{when}</td>
                  <td className="py-2 pr-3">
                    {game.size}×{game.size}
                  </td>
                  <td className="py-2 pr-3">{game.moves}번</td>
                  <td className="py-2 pr-3">{formatTime(game.timeMs)}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      aria-label={`${label} 기록 삭제`}
                      disabled={remove.isPending}
                      onClick={() => handleDelete(game.id, label)}
                      className="cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-300 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <nav aria-label="기록 페이지" className="flex items-center justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className={pageButtonClass}
          >
            이전
          </button>
          <span className="tabular-nums text-slate-700">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={page === lastPage}
            className={pageButtonClass}
          >
            다음
          </button>
        </nav>
      )}
    </div>
  )
}
