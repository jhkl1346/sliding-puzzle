import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'server',
    environment: 'node',
    // 테스트 DB 준비 (마이그레이션 적용, 데이터 비우기)
    globalSetup: ['./src/test/globalSetup.ts'],
    // 원격 DB(Neon)를 쓰는 테스트는 첫 접속이 느릴 수 있다.
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
})
