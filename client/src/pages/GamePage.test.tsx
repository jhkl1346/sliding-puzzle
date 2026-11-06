import {
  canMove,
  movableTiles,
  shuffle,
  shuffleWithMoves,
  tileInDirection,
} from '@sliding-puzzle/shared'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TILE_THEMES, tileColors } from '../lib/tileThemes'
import { renderWithProviders } from '../test/utils'
import { GamePage } from './GamePage'

const SEED = 777

// 연습 모드 (서버를 쓰지 않는다). 색 디자인은 기본으로 첫 번째(파스텔)로 고정한다.
function renderGame(themeRandom: () => number = () => 0) {
  const { user } = renderWithProviders(
    <GamePage randomSeed={() => SEED} themeRandom={themeRandom} />,
  )
  return { user, board: screen.getByRole('group', { name: /퍼즐 판/ }) }
}

function tileButton(tile: number) {
  return screen.getByRole('button', { name: new RegExp(`^타일 ${tile},`) })
}

function tileFace(tile: number) {
  return within(tileButton(tile)).getByText(String(tile))
}

describe('GamePage', () => {
  it('3×3 판에 타일 8개를 보여주고 이동 0회에서 시작한다', () => {
    const { board } = renderGame()

    expect(within(board).getAllByRole('button')).toHaveLength(8)
    expect(screen.getByRole('status')).toHaveTextContent('이동 0회')
    expect(screen.getByText('00:00.0')).toBeInTheDocument()
  })

  it('타일은 지금 위치가 아니라 원래 자리에 맞는 색을 쓴다', () => {
    renderGame()
    const pastel = TILE_THEMES[0]!

    // 섞여 있어도 타일 1은 항상 왼쪽 위 색, 타일 8은 마지막 칸 근처 색이다.
    for (const tile of [1, 8]) {
      const { background, color } = tileColors(pastel, tile, 3)
      expect(tileFace(tile)).toHaveStyle({ backgroundColor: background, color })
    }
  })

  it('1번 자리(왼쪽 위)에 점선과 오른쪽 화살표를 보여준다', () => {
    renderGame()

    expect(screen.getByTestId('start-marker')).toBeInTheDocument()
    expect(screen.getByTestId('start-arrow')).not.toHaveClass('invisible')
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
    expect(screen.getByText('하면 기록이 저장돼요.', { exact: false })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`^${solution.length}번 이동`))).toBeInTheDocument()

    // 끝난 판의 타일은 더 이상 누를 수 없다.
    expect(tileButton(1)).toBeDisabled()
    // 완성된 무늬가 잘 보이도록 시작 표시를 숨긴다. (화살표는 자리만 남긴다)
    expect(screen.queryByTestId('start-marker')).not.toBeInTheDocument()
    expect(screen.getByTestId('start-arrow')).toHaveClass('invisible')

    const restart = screen.getByRole('button', { name: '다시 하기' })
    expect(restart).toHaveFocus()
    await user.click(restart)

    expect(screen.queryByRole('heading', { name: '완성했어요!' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('이동 0회')
    expect(screen.getByTestId('start-marker')).toBeInTheDocument()
  })

  it('새 게임을 시작할 때마다 색 디자인이 바뀌고, 바로 전 판과 겹치지 않는다', async () => {
    // 난수가 늘 0이어도, 바로 전 디자인을 빼고 고르므로 매번 다른 디자인이 나온다.
    const { user } = renderGame(() => 0)
    const seen = [tileFace(1).style.backgroundColor]

    for (let round = 0; round < 3; round++) {
      await user.click(screen.getByRole('button', { name: '새로 섞기' }))
      seen.push(tileFace(1).style.backgroundColor)
    }

    for (let index = 1; index < seen.length; index++) {
      expect(seen[index]).not.toBe(seen[index - 1])
    }
  })

  it('판 크기를 바꾸면 그 크기로 새 게임을 시작한다', async () => {
    const { user } = renderGame()

    await user.click(screen.getByRole('button', { name: '4×4' }))

    const board = screen.getByRole('group', { name: '4×4 퍼즐 판' })
    expect(within(board).getAllByRole('button')).toHaveLength(15)
    expect(screen.getByRole('button', { name: '4×4' })).toHaveAttribute('aria-pressed', 'true')
  })
})
