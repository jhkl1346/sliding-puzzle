import { MAX_SEED } from '@sliding-puzzle/shared'

// 연습 모드에서 쓸 시드. (마일스톤 5부터는 서버가 시드를 정해 준다)
export function randomSeed(): number {
  return Math.floor(Math.random() * (MAX_SEED + 1))
}
