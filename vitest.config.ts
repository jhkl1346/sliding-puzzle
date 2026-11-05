import { defineConfig } from 'vitest/config'

// 루트에서 `npm test`를 실행하면 세 패키지의 테스트를 한 번에 돌린다.
export default defineConfig({
  test: {
    projects: ['shared', 'client', 'server'],
  },
})
