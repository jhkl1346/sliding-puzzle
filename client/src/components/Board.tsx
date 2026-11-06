import { type Board as BoardState, canMove, EMPTY } from '@sliding-puzzle/shared'
import type { ReactNode } from 'react'
import { type TileTheme, tileColors } from '../lib/tileThemes'
import { Tile } from './Tile'

interface BoardProps {
  board: BoardState
  size: number
  disabled: boolean
  theme: TileTheme
  // 1번 자리(왼쪽 위) 점선과 오른쪽 화살표를 보여 줄지. 다 맞추면 숨긴다.
  showStartHint: boolean
  onMove: (tile: number) => void
  children?: ReactNode
}

const HINT_COLOR = '#0369a1' // sky-700

export function Board({
  board,
  size,
  disabled,
  theme,
  showStartHint,
  onMove,
  children,
}: BoardProps) {
  // 타일을 번호 순서로 그려서, 이동해도 같은 화면 요소가 유지되게 한다. (애니메이션이 자연스러워짐)
  const tiles = board
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => tile !== EMPTY)
    .toSorted((a, b) => a.tile - b.tile)
  const cell = `${100 / size}%`

  return (
    <div className="w-full max-w-md">
      {/* 1번 칸 위의 작은 화살표: 숫자가 오른쪽으로 이어진다는 표시. 숨길 때도 자리는 남겨서 화면이 흔들리지 않게 한다. */}
      <div
        data-testid="start-arrow"
        aria-hidden="true"
        className={`mb-1 px-[1.5%] ${showStartHint ? '' : 'invisible'}`}
      >
        {/* 1번 칸 너비만 한 상자 안에서 가운데 정렬 → 칸 크기가 바뀌어도 타일 면 가운데 위에 온다. */}
        <div className="flex justify-center" style={{ width: cell }}>
          {/* 칸 너비의 35%. 선만 늘어나고 화살촉은 늘 같은 크기로 보이게 따로 그린다. */}
          <div className="relative h-2.5" style={{ width: '35%' }}>
            <svg
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <line
                x1="0"
                y1="5"
                x2="100"
                y2="5"
                stroke={HINT_COLOR}
                strokeWidth="1.3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <svg
              viewBox="0 0 6 10"
              className="absolute top-0 -right-px h-full w-1.5 overflow-visible"
            >
              <path
                d="M1 1.5 L5.5 5 L1 8.5"
                fill="none"
                stroke={HINT_COLOR}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div
        role="group"
        aria-label={`${size}×${size} 퍼즐 판`}
        className="@container relative aspect-square w-full rounded-xl bg-slate-300 p-[1.5%]"
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
              colors={tileColors(theme, tile, size)}
              onMove={onMove}
            />
          ))}
          {/* 1번이 들어갈 자리(왼쪽 위 칸) 점선. 타일 위에 그리지만 클릭은 그대로 아래 타일로 간다. */}
          {showStartHint && (
            <div
              data-testid="start-marker"
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 p-[1.5%]"
              style={{ width: cell, height: cell }}
            >
              {/* CSS 점선은 간격을 조절할 수 없어서 SVG로 그린다.
                  둥근 끝이 양쪽으로 1px씩 늘어나므로 실제로는 선 약 6px, 빈칸 약 8px로 보인다. */}
              <svg className="block h-full w-full overflow-visible">
                {/* 같은 점선을 흰색으로 두껍게 한 번 더 깔아서, 어두운 타일(클래식 체스판 남색) 위에서도 보이게 한다. */}
                {[
                  { stroke: '#ffffff', width: 4 },
                  { stroke: HINT_COLOR, width: 2 },
                ].map(({ stroke, width }) => (
                  <rect
                    key={stroke}
                    x="1"
                    y="1"
                    rx="7"
                    style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={width}
                    strokeDasharray="4 10"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
