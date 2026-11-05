import { type Size, SIZES } from '@sliding-puzzle/shared'

interface SizeSelectorProps {
  value: Size
  onChange: (size: Size) => void
}

export function SizeSelector({ value, onChange }: SizeSelectorProps) {
  return (
    <div role="group" aria-label="판 크기" className="flex gap-2">
      {SIZES.map((size) => (
        <button
          key={size}
          type="button"
          aria-pressed={size === value}
          onClick={() => onChange(size)}
          className="cursor-pointer rounded-lg border-2 border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:border-sky-500 focus-visible:ring-4 focus-visible:ring-sky-500 focus-visible:outline-none aria-pressed:border-sky-700 aria-pressed:bg-sky-700 aria-pressed:text-white"
        >
          {size}×{size}
        </button>
      ))}
    </div>
  )
}
