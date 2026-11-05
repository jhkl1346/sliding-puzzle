import { type Board as BoardState, canMove, EMPTY } from '@sliding-puzzle/shared'
import type { ReactNode } from 'react'
import { Tile } from './Tile'

interface BoardProps {
  board: BoardState
  size: number
  disabled: boolean
  onMove: (tile: number) => void
  children?: ReactNode
}

export function Board({ board, size, disabled, onMove, children }: BoardProps) {
  // 타일을 번호 순서로 그려서, 이동해도 같은 화면 요소가 유지되게 한다. (애니메이션이 자연스러워짐)
  const tiles = board
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => tile !== EMPTY)
    .toSorted((a, b) => a.tile - b.tile)

  return (
    <div
      role="group"
      aria-label={`${size}×${size} 퍼즐 판`}
      className="@container relative aspect-square w-full max-w-md rounded-xl bg-slate-300 p-[1.5%]"
    >
      {/* 글자 크기를 판 너비(cqw)에 맞춰서, 크기를 추가해도 따로 정하지 않아도 되게 한다. */}
      <div className="relative h-full w-full" style={{ fontSize: `${40 / size}cqw` }}>
        {tiles.map(({ tile, index }) => (
          <Tile
            key={tile}
            tile={tile}
            index={index}
            size={size}
            movable={canMove(board, size, tile)}
            disabled={disabled}
            onMove={onMove}
          />
        ))}
      </div>
      {children}
    </div>
  )
}
