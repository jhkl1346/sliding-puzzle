import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/errorHandler'

export interface AppOptions {
  // 쿠키를 주고받을 수 있게 허용할 클라이언트 주소
  clientOrigin: string
}

// 테스트에서 서버를 띄우지 않고 import해서 쓸 수 있게 앱 생성과 실행을 분리한다.
export function createApp({ clientOrigin }: AppOptions) {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: clientOrigin, credentials: true }))
  // 이동 기록이 들어와도 넉넉하고, 너무 큰 요청은 막는 크기
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use(notFound)
  app.use(errorHandler)

  return app
}
