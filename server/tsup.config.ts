import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
  // shared는 TypeScript 소스 그대로 쓰므로 빌드 결과물 안에 함께 묶는다.
  noExternal: ['@sliding-puzzle/shared'],
})
