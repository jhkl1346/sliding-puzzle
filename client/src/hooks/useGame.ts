import { type Direction, type Size, tileInDirection } from '@sliding-puzzle/shared'
import { useCallback, useReducer } from 'react'
import { createGame, gameReducer, isFinished } from '../game/gameReducer'

export function useGame(initialSize: Size, randomSeed: () => number) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createGame(initialSize, randomSeed()),
  )

  // 연습 모드: 브라우저에서 시드를 정해 시작한다.
  const start = useCallback(
    (size: Size) => dispatch({ type: 'start', size, seed: randomSeed() }),
    [randomSeed],
  )

  // 기록 모드: 서버가 정해 준 시드로 시작한다.
  const begin = useCallback(
    (size: Size, seed: number, serverGameId: string) =>
      dispatch({ type: 'start', size, seed, serverGameId }),
    [],
  )

  const moveTile = useCallback(
    (tile: number) => dispatch({ type: 'move', tile, now: Date.now() }),
    [],
  )

  const moveInDirection = useCallback(
    (direction: Direction) => {
      const tile = tileInDirection(state.board, state.size, direction)
      if (tile !== null) moveTile(tile)
    },
    [state.board, state.size, moveTile],
  )

  return { state, finished: isFinished(state), start, begin, moveTile, moveInDirection }
}
