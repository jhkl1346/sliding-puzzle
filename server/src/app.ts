import express from 'express'

// 테스트에서 서버를 띄우지 않고 import해서 쓸 수 있게 앱 생성과 실행을 분리한다.
export function createApp() {
  const app = express()

  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return app
}
