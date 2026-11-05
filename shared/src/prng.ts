// 시드 기반 난수 생성기 (mulberry32).
// 같은 시드를 넣으면 항상 같은 순서로 수가 나와서, 서버가 같은 퍼즐을 다시 만들 수 있다.
export function createRandom(seed: number): () => number {
  let state = seed >>> 0

  // 0 이상 1 미만의 수를 돌려준다.
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
