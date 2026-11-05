import { describe, expect, it } from 'vitest'
import { createSolved, move, movableTiles } from './board'
import type { Size } from './constants'
import { replay } from './replay'
import { shuffle, shuffleWithMoves } from './shuffle'

// 섞을 때 쓴 이동을 거꾸로 하면 올바른 풀이가 된다.
function solutionFor(size: Size, seed: number): number[] {
  return shuffleWithMoves(size, seed).moves.toReversed()
}

// 풀이의 index번째 이동 직전 판에서 움직일 수 없는 타일 하나를 고른다.
function blockedTileAt(size: Size, seed: number, moveLog: number[], index: number): number {
  const board = moveLog
    .slice(0, index)
    .reduce((current, tile) => move(current, size, tile), shuffle(size, seed))
  const movable = movableTiles(board, size)
  return createSolved(size).find((tile) => tile !== 0 && !movable.includes(tile))!
}

describe('replay', () => {
  it('올바른 풀이는 통과하고, 이동 횟수를 직접 센다', () => {
    const moveLog = solutionFor(3, 777)
    expect(replay(3, 777, moveLog)).toEqual({ ok: true, moves: moveLog.length })
  })

  it('4×4, 5×5도 올바른 풀이를 통과시킨다', () => {
    expect(replay(4, 5, solutionFor(4, 5)).ok).toBe(true)
    expect(replay(5, 5, solutionFor(5, 5)).ok).toBe(true)
  })

  it('지원하지 않는 크기는 거부한다', () => {
    expect(replay(6, 1, [])).toEqual({ ok: false, reason: 'INVALID_SIZE' })
    expect(replay(2, 1, [])).toEqual({ ok: false, reason: 'INVALID_SIZE' })
  })

  it('중간에 빈칸과 떨어진 타일을 움직이면 그 위치와 함께 거부한다', () => {
    const moveLog = solutionFor(3, 777)
    const tampered = [...moveLog]
    tampered.splice(5, 0, blockedTileAt(3, 777, moveLog, 5))

    expect(replay(3, 777, tampered)).toEqual({ ok: false, reason: 'INVALID_MOVE', moveIndex: 5 })
  })

  it('판에 없는 타일 번호나 정수가 아닌 값은 거부한다', () => {
    expect(replay(3, 777, [99])).toEqual({ ok: false, reason: 'INVALID_MOVE', moveIndex: 0 })
    expect(replay(3, 777, [0])).toEqual({ ok: false, reason: 'INVALID_MOVE', moveIndex: 0 })
    expect(replay(3, 777, [1.5])).toEqual({ ok: false, reason: 'INVALID_MOVE', moveIndex: 0 })
  })

  it('끝까지 재생해도 완성되지 않으면 거부한다', () => {
    const moveLog = solutionFor(3, 777)
    expect(replay(3, 777, moveLog.slice(0, -1))).toEqual({ ok: false, reason: 'NOT_SOLVED' })
    expect(replay(3, 777, [])).toEqual({ ok: false, reason: 'NOT_SOLVED' })
  })

  it('다른 시드의 풀이는 통과하지 못한다', () => {
    expect(replay(3, 778, solutionFor(3, 777)).ok).toBe(false)
  })
})
