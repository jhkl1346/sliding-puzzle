import { type Board, canMove, isSolved, move, shuffle, type Size } from '@sliding-puzzle/shared'

export interface GameState {
  // 새 게임을 시작할 때마다 1씩 늘어나는 번호. 화면에서 판을 새로 그릴 때 쓴다.
  gameId: number
  size: Size
  seed: number
  board: Board
  // 움직인 타일 번호 순서. 마일스톤 5에서 서버에 그대로 보내 재생 검증을 받는다.
  moveLog: number[]
  // 첫 이동 시각. 첫 이동 전에는 타이머가 돌지 않는다.
  startedAt: number | null
  // 완성한 시각. 값이 있으면 게임이 끝난 것이다.
  finishedAt: number | null
}

export type GameAction =
  { type: 'start'; size: Size; seed: number } | { type: 'move'; tile: number; now: number }

export function createGame(size: Size, seed: number, gameId = 0): GameState {
  return {
    gameId,
    size,
    seed,
    board: shuffle(size, seed),
    moveLog: [],
    startedAt: null,
    finishedAt: null,
  }
}

export function isFinished(state: GameState): boolean {
  return state.finishedAt !== null
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return createGame(action.size, action.seed, state.gameId + 1)

    case 'move': {
      // 끝난 게임이거나 움직일 수 없는 타일이면 아무것도 바꾸지 않는다.
      if (isFinished(state) || !canMove(state.board, state.size, action.tile)) return state

      const board = move(state.board, state.size, action.tile)
      return {
        ...state,
        board,
        moveLog: [...state.moveLog, action.tile],
        startedAt: state.startedAt ?? action.now,
        finishedAt: isSolved(board, state.size) ? action.now : null,
      }
    }
  }
}
