import { type Direction, type Size, tileInDirection } from '@sliding-puzzle/shared'
import { useCallback, useReducer } from 'react'
import { createGame, gameReducer, isFinished } from '../game/gameReducer'

export function useGame(initialSize: Size, randomSeed: () => number) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createGame(initialSize, randomSeed()),
  )

  const start = useCallback(
    (size: Size) => dispatch({ type: 'start', size, seed: randomSeed() }),
    [randomSeed],
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

  return { state, finished: isFinished(state), start, moveTile, moveInDirection }
}
