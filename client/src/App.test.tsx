import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('연습 모드 게임 화면을 보여준다', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Sliding Puzzle' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '3×3 퍼즐 판' })).toBeInTheDocument()
  })
})
