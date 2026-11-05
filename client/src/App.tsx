import { SIZES } from '@sliding-puzzle/shared'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
      <h1 className="text-3xl font-bold">Sliding Puzzle</h1>
      <p className="text-slate-600">
        지원 크기: {SIZES.map((size) => `${size}×${size}`).join(', ')}
      </p>
    </main>
  )
}
