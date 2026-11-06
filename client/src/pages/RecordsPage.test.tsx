import type { CompletedGame, SizeStats, StatsResponse } from '@sliding-puzzle/shared'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { jsonResponse, mockFetch, GUEST, renderApp } from '../test/utils'

const USER = { id: 'user-1', username: 'player_one' }
const LOGGED_IN = () => jsonResponse(200, { user: USER })
const TZ = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
const STATS_URL = `GET /api/stats?tz=${TZ}`

const emptySize = (size: number): SizeStats => ({
  size,
  completed: 0,
  attempted: 0,
  completionRate: null,
  best: { moves: null, timeMs: null },
  average: { moves: null, timeMs: null },
})

const dates = [
  '2026-10-30',
  '2026-10-31',
  '2026-11-01',
  '2026-11-02',
  '2026-11-03',
  '2026-11-04',
  '2026-11-05',
]
const emptyTrend = (size: number) => ({
  size,
  points: dates.map((date) => ({ date, games: 0, averageMoves: null, averageTimeMs: null })),
})

const EMPTY_STATS: StatsResponse = {
  timeZone: 'Asia/Seoul',
  sizes: [emptySize(3), emptySize(4), emptySize(5)],
  trend: [emptyTrend(3), emptyTrend(4), emptyTrend(5)],
}

const STATS: StatsResponse = {
  ...EMPTY_STATS,
  sizes: [
    {
      size: 3,
      completed: 2,
      attempted: 4,
      completionRate: 0.5,
      best: { moves: 80, timeMs: 60_000 },
      average: { moves: 90, timeMs: 75_000 },
    },
    { ...emptySize(4), attempted: 1, completionRate: 0 },
    emptySize(5),
  ],
  trend: [
    {
      size: 3,
      points: emptyTrend(3).points.map((point) =>
        point.date === '2026-11-04'
          ? { ...point, games: 2, averageMoves: 90, averageTimeMs: 75_000 }
          : point,
      ),
    },
    emptyTrend(4),
    emptyTrend(5),
  ],
}

const game = (id: string, moves: number): CompletedGame => ({
  id,
  size: 3,
  moves,
  timeMs: 61_200,
  finishedAt: '2026-11-04T05:30:00.000Z',
})

const gameList = (games: CompletedGame[], { page = 1, total = games.length } = {}) =>
  jsonResponse(200, { games, page, pageSize: 20, total })

// 내 기록 페이지는 필요할 때 불러오는(lazy) 코드라서, 첫 테스트가 느려지지 않게 미리 불러 둔다.
beforeAll(async () => {
  await import('./RecordsPage')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('내 기록 페이지', () => {
  it('로그인하지 않았으면 로그인 화면으로 보낸다', async () => {
    mockFetch({ 'GET /api/auth/me': GUEST })
    renderApp('/records')

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('불러오는 동안 로딩 문구를 보여준다', async () => {
    mockFetch({ 'GET /api/auth/me': LOGGED_IN, [STATS_URL]: () => new Promise(() => {}) })
    renderApp('/records')

    expect(await screen.findByText('기록을 불러오는 중…')).toBeInTheDocument()
  })

  it('기록이 없으면 첫 게임을 해 보라고 안내한다', async () => {
    mockFetch({ 'GET /api/auth/me': LOGGED_IN, [STATS_URL]: () => jsonResponse(200, EMPTY_STATS) })
    renderApp('/records')

    expect(await screen.findByText('아직 기록이 없어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '게임하러 가기' })).toHaveAttribute('href', '/')
  })

  it('불러오지 못하면 이유를 보여주고 다시 시도할 수 있다', async () => {
    let attempts = 0
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      [STATS_URL]: () =>
        ++attempts === 1
          ? jsonResponse(500, {
              error: { code: 'INTERNAL_ERROR', message: '서버에 문제가 생겼어요.' },
            })
          : jsonResponse(200, EMPTY_STATS),
    })
    const { user } = renderApp('/records')

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 문제가 생겼어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('아직 기록이 없어요.')).toBeInTheDocument()
  })

  it('크기별 최고 기록·평균·완료율을 보여준다', async () => {
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      [STATS_URL]: () => jsonResponse(200, STATS),
      'GET /api/games?page=1': () => gameList([game('g1', 80)]),
    })
    renderApp('/records')

    const three = await screen.findByRole('region', { name: '3×3' })
    expect(within(three).getByText('80번')).toBeInTheDocument() // 최소 이동
    expect(within(three).getByText('01:00.0')).toBeInTheDocument() // 최단 시간
    expect(within(three).getByText('90번')).toBeInTheDocument() // 평균 이동
    expect(within(three).getByText('50%')).toBeInTheDocument()
    expect(within(three).getByText('(2/4판)')).toBeInTheDocument()

    const four = screen.getByRole('region', { name: '4×4' })
    expect(within(four).getByText('아직 완료한 게임이 없어요.')).toBeInTheDocument()
    expect(within(four).getByText('0%')).toBeInTheDocument()
  })

  it('추이를 표로도 볼 수 있고, 지표를 바꿀 수 있다', async () => {
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      [STATS_URL]: () => jsonResponse(200, STATS),
      'GET /api/games?page=1': () => gameList([game('g1', 80)]),
    })
    const { user } = renderApp('/records')

    await user.click(await screen.findByText('표로 보기'))
    const table = screen.getByRole('table', { name: '최근 7일 3×3 날짜별 기록' })
    expect(within(table).getAllByRole('row')).toHaveLength(8) // 머리 1줄 + 7일
    expect(within(table).getByRole('row', { name: '11/4 2판 90번' })).toBeInTheDocument()

    await user.click(
      within(screen.getByRole('group', { name: '추이 지표' })).getByRole('button', {
        name: '시간',
      }),
    )

    expect(screen.getByRole('heading', { name: '최근 7일 3×3 평균 시간' })).toBeInTheDocument()
    expect(within(table).getByRole('row', { name: '11/4 2판 01:15.0' })).toBeInTheDocument()
  })

  it('추이가 없는 크기를 고르면 빈 안내를 보여준다', async () => {
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      [STATS_URL]: () => jsonResponse(200, STATS),
      'GET /api/games?page=1': () => gameList([game('g1', 80)]),
    })
    const { user } = renderApp('/records')

    const sizeGroup = await screen.findByRole('group', { name: '추이를 볼 판 크기' })
    await user.click(within(sizeGroup).getByRole('button', { name: '5×5' }))

    expect(screen.getByText('최근 7일 동안 완료한 5×5 게임이 없어요.')).toBeInTheDocument()
  })

  it('최근 기록을 확인 후 삭제하고, 목록과 통계를 다시 불러온다', async () => {
    let deleted = false
    let statsCalls = 0
    const fetchMock = mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      [STATS_URL]: () => {
        statsCalls++
        return jsonResponse(200, STATS)
      },
      'GET /api/games?page=1': () =>
        gameList(deleted ? [game('g2', 95)] : [game('g1', 80), game('g2', 95)]),
      'DELETE /api/games/g1': () => {
        deleted = true
        return new Response(null, { status: 204 })
      },
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderApp('/records')

    const table = await screen.findByRole('table', { name: '최근 완료한 게임 기록' })
    expect(within(table).getAllByRole('button', { name: /기록 삭제$/ })).toHaveLength(2)
    await user.click(within(table).getAllByRole('button', { name: /기록 삭제$/ })[0]!)

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('되돌릴 수 없어요'))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/games/g1',
      expect.objectContaining({ method: 'DELETE' }),
    )
    await waitFor(() =>
      expect(within(table).getAllByRole('button', { name: /기록 삭제$/ })).toHaveLength(1),
    )
    expect(statsCalls).toBe(2)
  })

  it('삭제 확인을 취소하면 지우지 않는다', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      [STATS_URL]: () => jsonResponse(200, STATS),
      'GET /api/games?page=1': () => gameList([game('g1', 80)]),
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { user } = renderApp('/records')

    await user.click(await screen.findByRole('button', { name: /기록 삭제$/ }))

    expect(fetchMock).not.toHaveBeenCalledWith('/api/games/g1', expect.anything())
  })

  it('기록이 많으면 페이지를 넘길 수 있다', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      [STATS_URL]: () => jsonResponse(200, STATS),
      'GET /api/games?page=1': () => gameList([game('g1', 80)], { total: 25 }),
      'GET /api/games?page=2': () => gameList([game('g21', 99)], { page: 2, total: 25 }),
    })
    const { user } = renderApp('/records')

    const pager = await screen.findByRole('navigation', { name: '기록 페이지' })
    expect(within(pager).getByText('1 / 2')).toBeInTheDocument()
    expect(within(pager).getByRole('button', { name: '이전' })).toBeDisabled()
    await user.click(within(pager).getByRole('button', { name: '다음' }))

    expect(await within(pager).findByText('2 / 2')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/games?page=2', expect.anything())
    expect(await screen.findByText('99번')).toBeInTheDocument()
  })

  it('머리글에 내 기록 링크가 있다', async () => {
    mockFetch({ 'GET /api/auth/me': LOGGED_IN, 'POST /api/games': () => new Promise(() => {}) })
    renderApp('/')

    expect(await screen.findByRole('link', { name: '내 기록' })).toHaveAttribute('href', '/records')
  })
})
