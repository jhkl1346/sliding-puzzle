import type { TileColors } from '../lib/tileThemes'

interface TileProps {
  tile: number
  index: number
  size: number
  movable: boolean
  disabled: boolean
  colors: TileColors
  onMove: (tile: number) => void
}

export function Tile({ tile, index, size, movable, disabled, colors, onMove }: TileProps) {
  const row = Math.floor(index / size)
  const col = index % size
  const label = `타일 ${tile}, ${row + 1}행 ${col + 1}열${movable ? ', 빈칸 쪽으로 이동' : ''}`

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || !movable}
      onClick={() => onMove(tile)}
      // 칸 위치를 transform으로 옮겨서, 타일이 움직일 때 미끄러지는 애니메이션이 생긴다.
      className="group absolute top-0 left-0 p-[1.5%] outline-none transition-transform duration-150 ease-out enabled:cursor-pointer motion-reduce:transition-none"
      style={{
        width: `${100 / size}%`,
        height: `${100 / size}%`,
        transform: `translate(${col * 100}%, ${row * 100}%)`,
      }}
    >
      <span
        className="flex h-full w-full items-center justify-center rounded-lg font-bold shadow-sm group-focus-visible:ring-4 group-focus-visible:ring-sky-600 group-enabled:group-hover:brightness-95"
        style={{ backgroundColor: colors.background, color: colors.color }}
      >
        {tile}
      </span>
    </button>
  )
}
