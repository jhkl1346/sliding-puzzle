import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { mockFetch, NOT_LOGGED_IN } from './test/utils'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('첫 화면에서 연습 모드 게임을 보여준다', async () => {
    mockFetch({ 'GET /api/auth/me': NOT_LOGGED_IN })
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Sliding Puzzle' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '3×3 퍼즐 판' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: '로그인' })).toBeInTheDocument()
  })
})
