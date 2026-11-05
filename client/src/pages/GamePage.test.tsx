import {
  canMove,
  movableTiles,
  shuffle,
  shuffleWithMoves,
  tileInDirection,
} from '@sliding-puzzle/shared'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GamePage } from './GamePage'

const SEED = 777

function renderGame() {
  const user = userEvent.setup()
  render(<GamePage randomSeed={() => SEED} />)
  return { user, board: screen.getByRole('group', { name: /퍼즐 판/ }) }
}

function tileButton(tile: number) {
  return screen.getByRole('button', { name: new RegExp(`^타일 ${tile},`) })
}

describe('GamePage', () => {
  it('3×3 판에 타일 8개를 보여주고 이동 0회에서 시작한다', () => {
    const { board } = renderGame()

    expect(within(board).getAllByRole('button')).toHaveLength(8)
    expect(screen.getByRole('status')).toHaveTextContent('이동 0회')
    expect(screen.getByText('00:00.0')).toBeInTheDocument()
  })

  it('빈칸 옆 타일을 누르면 움직이고 이동 횟수가 늘어난다', async () => {
    const { user } = renderGame()
    const tile = movableTiles(shuffle(3, SEED), 3)[0]!

    await user.click(tileButton(tile))

    expect(screen.getByRole('status')).toHaveTextContent('이동 1회')
  })

  it('빈칸과 떨어진 타일은 누를 수 없다', () => {
    renderGame()
    const board = shuffle(3, SEED)
    const blocked = [1, 2, 3, 4, 5, 6, 7, 8].find((tile) => !canMove(board, 3, tile))!

    expect(tileButton(blocked)).toBeDisabled()
  })

  it('방향키로 타일을 움직일 수 있다', async () => {
    const { user } = renderGame()
    const board = shuffle(3, SEED)
    const key = tileInDirection(board, 3, 'up') !== null ? '{ArrowUp}' : '{ArrowDown}'

    await user.keyboard(key)

    expect(screen.getByRole('status')).toHaveTextContent('이동 1회')
  })

  it('다 맞추면 결과 화면을 보여주고, 다시 하기로 새 게임을 시작한다', async () => {
    const { user } = renderGame()
    const solution = shuffleWithMoves(3, SEED).moves.toReversed()

    for (const tile of solution) {
      await user.click(tileButton(tile))
    }

    expect(screen.getByRole('heading', { name: '완성했어요!' })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`^${solution.length}번 이동`))).toBeInTheDocument()

    // 끝난 판의 타일은 더 이상 누를 수 없다.
    expect(tileButton(1)).toBeDisabled()

    const restart = screen.getByRole('button', { name: '다시 하기' })
    expect(restart).toHaveFocus()
    await user.click(restart)

    expect(screen.queryByRole('heading', { name: '완성했어요!' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('이동 0회')
  })

  it('판 크기를 바꾸면 그 크기로 새 게임을 시작한다', async () => {
    const { user } = renderGame()

    await user.click(screen.getByRole('button', { name: '4×4' }))

    const board = screen.getByRole('group', { name: '4×4 퍼즐 판' })
    expect(within(board).getAllByRole('button')).toHaveLength(15)
    expect(screen.getByRole('button', { name: '4×4' })).toHaveAttribute('aria-pressed', 'true')
  })
})
