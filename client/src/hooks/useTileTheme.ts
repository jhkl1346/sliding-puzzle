import { useState } from 'react'
import { pickTheme, type TileTheme } from '../lib/tileThemes'

// 새 게임(gameId가 바뀔 때)마다 타일 색 디자인을 무작위로 바꾼다. 바로 전 판과 같은 디자인은 나오지 않는다.
export function useTileTheme(gameId: number, random: () => number = Math.random): TileTheme {
  const [current, setCurrent] = useState(() => ({ gameId, theme: pickTheme(null, random) }))

  // 렌더 중에 바로 새 디자인으로 바꿔서, 새 판이 이전 디자인으로 잠깐 보였다가 바뀌는 일이 없게 한다.
  if (current.gameId !== gameId) {
    const next = { gameId, theme: pickTheme(current.theme.id, random) }
    setCurrent(next)
    return next.theme
  }
  return current.theme
}
