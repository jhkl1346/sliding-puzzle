import { canMove, movableTiles, shuffle, shuffleWithMoves } from '@sliding-puzzle/shared'
import { describe, expect, it } from 'vitest'
import { createGame, type GameState, gameReducer, isFinished } from './gameReducer'

const SEED = 777

function moveAll(state: GameState, tiles: number[], now = 1000): GameState {
  return tiles.reduce(
    (current, tile, index) => gameReducer(current, { type: 'move', tile, now: now + index * 100 }),
    state,
  )
}

describe('createGame', () => {
  it('시드로 섞은 판에서 시작하고, 타이머는 아직 돌지 않는다', () => {
    const game = createGame(3, SEED)
    expect(game.board).toEqual(shuffle(3, SEED))
    expect(game.moveLog).toEqual([])
    expect(game.startedAt).toBeNull()
    expect(isFinished(game)).toBe(false)
  })
})

describe('gameReducer', () => {
  it('움직일 수 있는 타일을 옮기고 이동 기록에 남긴다', () => {
    const game = createGame(3, SEED)
    const tile = movableTiles(game.board, 3)[0]!
    const next = gameReducer(game, { type: 'move', tile, now: 5000 })

    expect(next.moveLog).toEqual([tile])
    expect(next.board).not.toEqual(game.board)
  })

  it('첫 이동 시각부터 시간을 재고, 이후 이동은 시작 시각을 바꾸지 않는다', () => {
    const game = createGame(3, SEED)
    const first = movableTiles(game.board, 3)[0]!
    const afterFirst = gameReducer(game, { type: 'move', tile: first, now: 5000 })
    const afterSecond = gameReducer(afterFirst, { type: 'move', tile: first, now: 7000 })

    expect(afterFirst.startedAt).toBe(5000)
    expect(afterSecond.startedAt).toBe(5000)
  })

  it('움직일 수 없는 타일이면 상태를 그대로 둔다', () => {
    const game = createGame(3, SEED)
    const blocked = [1, 2, 3, 4, 5, 6, 7, 8].find((tile) => !canMove(game.board, 3, tile))!

    expect(gameReducer(game, { type: 'move', tile: blocked, now: 5000 })).toBe(game)
  })

  it('완성하면 끝난 시각을 기록하고, 그 뒤 이동은 무시한다', () => {
    const solution = shuffleWithMoves(3, SEED).moves.toReversed()
    const solved = moveAll(createGame(3, SEED), solution)

    expect(isFinished(solved)).toBe(true)
    expect(solved.moveLog).toEqual(solution)
    expect(solved.finishedAt! - solved.startedAt!).toBe((solution.length - 1) * 100)

    const tile = movableTiles(solved.board, 3)[0]!
    expect(gameReducer(solved, { type: 'move', tile, now: 99_999 })).toBe(solved)
  })

  it('start는 새 크기와 시드로 처음부터 다시 시작한다', () => {
    const played = moveAll(createGame(3, SEED), [movableTiles(shuffle(3, SEED), 3)[0]!])
    const restarted = gameReducer(played, { type: 'start', size: 4, seed: 1 })

    expect(restarted).toEqual(createGame(4, 1, played.gameId + 1))
  })
})
