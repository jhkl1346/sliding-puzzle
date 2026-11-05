import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 개발 중에는 /api 요청을 Express 서버로 넘겨서 같은 도메인처럼 쓴다.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    name: 'client',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // 퍼즐을 끝까지 푸는 테스트는 타일을 수십 번 클릭해서, 다른 테스트와 함께 돌면 5초(기본값)를 넘길 수 있다.
    testTimeout: 15_000,
  },
})
