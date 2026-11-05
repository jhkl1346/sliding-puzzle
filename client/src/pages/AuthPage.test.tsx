import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, mockFetch, NOT_LOGGED_IN, renderApp } from '../test/utils'

const USER = { id: 'user-1', username: 'player_one' }

afterEach(() => {
  vi.unstubAllGlobals()
})

async function fillAndSubmit(
  user: ReturnType<typeof renderApp>['user'],
  username: string,
  password: string,
  submitLabel: string,
) {
  await user.type(screen.getByLabelText('아이디'), username)
  await user.type(screen.getByLabelText('비밀번호'), password)
  await user.click(screen.getByRole('button', { name: submitLabel }))
}

describe('로그인 화면', () => {
  it('로그인하면 게임 화면으로 가고 머리글에 내 아이디가 보인다', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': NOT_LOGGED_IN,
      'POST /api/auth/login': () => jsonResponse(200, { user: USER }),
    })
    const { user } = renderApp('/login')

    await fillAndSubmit(user, 'Player_One', 'correct-horse-1', '로그인')

    expect(await screen.findByText('player_one님')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Sliding Puzzle' })).toBeInTheDocument()
    // 서버에는 정리된 아이디(소문자)를 보낸다.
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ username: 'player_one', password: 'correct-horse-1' }),
      }),
    )
  })

  it('비밀번호가 틀리면 서버 메시지를 보여주고 화면에 머문다', async () => {
    mockFetch({
      'GET /api/auth/me': NOT_LOGGED_IN,
      'POST /api/auth/login': () =>
        jsonResponse(401, {
          error: { code: 'INVALID_CREDENTIALS', message: '아이디 또는 비밀번호가 틀렸어요.' },
        }),
    })
    const { user } = renderApp('/login')

    await fillAndSubmit(user, 'player_one', 'wrong-password', '로그인')

    expect(await screen.findByRole('alert')).toHaveTextContent('아이디 또는 비밀번호가 틀렸어요.')
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('규칙에 맞지 않는 입력은 서버에 보내지 않고 바로 알려준다', async () => {
    const fetchMock = mockFetch({ 'GET /api/auth/me': NOT_LOGGED_IN })
    const { user } = renderApp('/login')

    await fillAndSubmit(user, 'ab', 'short', '로그인')

    expect(screen.getByText('아이디는 3자 이상이어야 해요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호는 8자 이상이어야 해요.')).toBeInTheDocument()
    expect(screen.getByLabelText('아이디')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalledWith('/api/auth/login', expect.anything())
  })

  it('서버에 연결하지 못하면 안내 메시지를 보여준다', async () => {
    mockFetch({
      'GET /api/auth/me': NOT_LOGGED_IN,
      'POST /api/auth/login': () => {
        throw new TypeError('Failed to fetch')
      },
    })
    const { user } = renderApp('/login')

    await fillAndSubmit(user, 'player_one', 'correct-horse-1', '로그인')

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결하지 못했어요.')
  })

  it('이미 로그인했으면 게임 화면으로 보낸다', async () => {
    mockFetch({ 'GET /api/auth/me': () => jsonResponse(200, { user: USER }) })
    renderApp('/login')

    expect(await screen.findByRole('heading', { name: 'Sliding Puzzle' })).toBeInTheDocument()
  })
})

describe('회원가입 화면', () => {
  it('가입하면 바로 로그인된 상태로 게임 화면에 간다', async () => {
    mockFetch({
      'GET /api/auth/me': NOT_LOGGED_IN,
      'POST /api/auth/register': () => jsonResponse(201, { user: USER }),
    })
    const { user } = renderApp('/register')

    await fillAndSubmit(user, 'player_one', 'correct-horse-1', '회원가입')

    expect(await screen.findByText('player_one님')).toBeInTheDocument()
  })

  it('이미 있는 아이디면 서버 메시지를 보여준다', async () => {
    mockFetch({
      'GET /api/auth/me': NOT_LOGGED_IN,
      'POST /api/auth/register': () =>
        jsonResponse(409, {
          error: { code: 'USERNAME_TAKEN', message: '이미 사용 중인 아이디예요.' },
        }),
    })
    const { user } = renderApp('/register')

    await fillAndSubmit(user, 'player_one', 'correct-horse-1', '회원가입')

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 사용 중인 아이디예요.')
  })

  it('입력 규칙 안내를 보여준다', () => {
    mockFetch({ 'GET /api/auth/me': NOT_LOGGED_IN })
    renderApp('/register')

    expect(screen.getByLabelText('아이디')).toHaveAccessibleDescription(/영문, 숫자, 밑줄/)
    expect(screen.getByLabelText('비밀번호')).toHaveAccessibleDescription('8자 이상')
  })
})

describe('머리글', () => {
  it('로그인하지 않았으면 로그인·회원가입 링크를 보여준다', async () => {
    mockFetch({ 'GET /api/auth/me': NOT_LOGGED_IN })
    renderApp('/')

    expect(await screen.findByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/register')
  })

  it('로그아웃하면 다시 로그인 링크가 보인다', async () => {
    mockFetch({
      'GET /api/auth/me': () => jsonResponse(200, { user: USER }),
      'POST /api/auth/logout': () => new Response(null, { status: 204 }),
    })
    const { user } = renderApp('/')

    await user.click(await screen.findByRole('button', { name: '로그아웃' }))

    expect(await screen.findByRole('link', { name: '로그인' })).toBeInTheDocument()
    expect(screen.queryByText('player_one님')).not.toBeInTheDocument()
  })
})
