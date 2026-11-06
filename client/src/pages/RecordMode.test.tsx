import { shuffleWithMoves } from '@sliding-puzzle/shared'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, mockFetch, GUEST, NOT_LOGGED_IN, renderApp } from '../test/utils'

const USER = { id: 'user-1', username: 'player_one' }
const SEED = 777
const SOLUTION = shuffleWithMoves(3, SEED).moves.toReversed()

const LOGGED_IN = () => jsonResponse(200, { user: USER })
const startedGame = (id: string) => () => jsonResponse(201, { id, size: 3, seed: SEED })
const finished = (newBest: { moves: boolean; time: boolean }) => () =>
  jsonResponse(200, {
    game: { id: 'game-1', size: 3, moves: SOLUTION.length, timeMs: 5000, finishedAt: '' },
    newBest,
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

function tileButton(tile: number) {
  return screen.getByRole('button', { name: new RegExp(`^타일 ${tile},`) })
}

// 서버가 준 시드의 퍼즐이 나와서 움직일 수 있을 때까지 기다린다.
async function waitUntilPlayable() {
  await screen.findByText('기록 모드 · 다 풀면 기록이 저장돼요')
  await waitFor(() => expect(tileButton(SOLUTION[0]!)).toBeEnabled())
}

async function solve(user: ReturnType<typeof renderApp>['user']) {
  for (const tile of SOLUTION) {
    await user.click(tileButton(tile))
  }
}

describe('기록 모드 (로그인)', () => {
  it('서버가 준 시드로 시작하고, 다 풀면 이동 기록과 시간만 제출한다', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      'POST /api/games': startedGame('game-1'),
      'POST /api/games/game-1/finish': finished({ moves: true, time: false }),
    })
    const { user } = renderApp('/')
    await waitUntilPlayable()

    await solve(user)

    expect(await screen.findByText('기록을 저장했어요.')).toBeInTheDocument()
    expect(screen.getByText('🏆 최소 이동 기록 달성!')).toBeInTheDocument()
    expect(screen.queryByText('⏱️ 최단 시간 기록 달성!')).not.toBeInTheDocument()

    const finishCall = fetchMock.mock.calls.find(([url]) => url === '/api/games/game-1/finish')!
    const body = JSON.parse(String(finishCall[1]!.body))
    expect(body.moveLog).toEqual(SOLUTION)
    expect(body.timeMs).toBeGreaterThanOrEqual(0)
    // 이동 횟수는 보내지 않는다. (서버가 직접 센다)
    expect(Object.keys(body).toSorted()).toEqual(['moveLog', 'timeMs'])
  })

  it('서버에서 퍼즐을 받는 동안에는 타일을 누를 수 없다', async () => {
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      // 응답이 오지 않는 상태
      'POST /api/games': () => new Promise<Response>(() => {}),
    })
    renderApp('/')

    expect(await screen.findByText('새 퍼즐을 준비하는 중…')).toBeInTheDocument()
    for (const tile of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(tileButton(tile)).toBeDisabled()
    }
  })

  it('퍼즐을 받지 못하면 이유를 보여주고, 다시 시도할 수 있다', async () => {
    let attempts = 0
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      'POST /api/games': () =>
        ++attempts === 1
          ? jsonResponse(500, {
              error: { code: 'INTERNAL_ERROR', message: '서버에 문제가 생겼어요.' },
            })
          : startedGame('game-1')(),
    })
    const { user } = renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 문제가 생겼어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    await waitUntilPlayable()
  })

  it('풀던 중에 새로 섞으면 이전 게임을 포기로 알리고 새 게임을 받는다', async () => {
    let started = 0
    const fetchMock = mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      'POST /api/games': () => startedGame(`game-${++started}`)(),
      'POST /api/games/game-1/abandon': () => new Response(null, { status: 204 }),
    })
    const { user } = renderApp('/')
    await waitUntilPlayable()
    await user.click(tileButton(SOLUTION[0]!))

    await user.click(screen.getByRole('button', { name: '새로 섞기' }))

    await waitFor(() => expect(started).toBe(2))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/games/game-1/abandon',
      expect.objectContaining({ method: 'POST' }),
    )
    await waitFor(() => expect(screen.getByText('0')).toBeInTheDocument())
  })

  it('제출할 때 로그인이 만료됐으면 알려주고, 다시 로그인 화면으로 보낸다', async () => {
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      'POST /api/games': startedGame('game-1'),
      'POST /api/games/game-1/finish': NOT_LOGGED_IN,
    })
    const { user } = renderApp('/')
    await waitUntilPlayable()
    await solve(user)

    expect(
      await screen.findByText('로그인이 만료돼서 기록을 저장하지 못했어요.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다시 로그인하기' }))

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.queryByText('player_one님')).not.toBeInTheDocument()
  })

  it('저장에 실패하면 서버 메시지를 보여주고 다시 시도할 수 있다', async () => {
    let attempts = 0
    mockFetch({
      'GET /api/auth/me': LOGGED_IN,
      'POST /api/games': startedGame('game-1'),
      'POST /api/games/game-1/finish': () =>
        ++attempts === 1
          ? jsonResponse(500, {
              error: { code: 'INTERNAL_ERROR', message: '서버에 문제가 생겼어요.' },
            })
          : finished({ moves: true, time: true })(),
    })
    const { user } = renderApp('/')
    await waitUntilPlayable()
    await solve(user)

    expect(await screen.findByText('서버에 문제가 생겼어요.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '저장 다시 시도' }))

    expect(await screen.findByText('기록을 저장했어요.')).toBeInTheDocument()
  })
})

describe('연습 모드 (비로그인)', () => {
  it('서버에 게임을 만들지 않는다', async () => {
    const fetchMock = mockFetch({ 'GET /api/auth/me': GUEST })
    renderApp('/')

    expect(await screen.findByText('연습 모드 · 기록은 저장되지 않아요')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1) // 내 정보 확인만
  })
})
