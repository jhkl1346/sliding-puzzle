import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('제목과 shared에서 가져온 판 크기를 보여준다', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Sliding Puzzle' })).toBeInTheDocument()
    expect(screen.getByText('지원 크기: 3×3, 4×4, 5×5')).toBeInTheDocument()
  })
})
