import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { errorBody } from './errors'
import type { PrismaClient } from './generated/prisma/client'
import { errorHandler, notFound } from './middleware/errorHandler'
import { createRequireAuth } from './middleware/requireAuth'
import { createAuthRouter } from './routes/auth'
import { createAuthService } from './services/authService'

export interface AppOptions {
  prisma: PrismaClient
  // 쿠키를 주고받을 수 있게 허용할 클라이언트 주소
  clientOrigin: string
  jwtSecret: string
  // HTTPS에서만 쿠키를 보내게 할지 (배포 환경에서는 true)
  secureCookies: boolean
  // bcrypt 해시 강도. 높을수록 안전하지만 느리다. (테스트에서는 낮춰서 빠르게 돌린다)
  bcryptRounds?: number
  // 로그인·회원가입 요청 제한: windowMs 동안 IP마다 limit번까지
  authRateLimit?: { windowMs: number; limit: number }
}

// 테스트에서 서버를 띄우지 않고 import해서 쓸 수 있게 앱 생성과 실행을 분리한다.
export function createApp({
  prisma,
  clientOrigin,
  jwtSecret,
  secureCookies,
  bcryptRounds = 12,
  authRateLimit = { windowMs: 15 * 60 * 1000, limit: 10 },
}: AppOptions) {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: clientOrigin, credentials: true }))
  // 이동 기록이 들어와도 넉넉하고, 너무 큰 요청은 막는 크기
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  const requireAuth = createRequireAuth(jwtSecret)
  const authLimiter = rateLimit({
    ...authRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(429)
        .json(errorBody('TOO_MANY_REQUESTS', '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'))
    },
  })

  app.use(
    '/api/auth',
    createAuthRouter({
      authService: createAuthService(prisma, bcryptRounds),
      jwtSecret,
      secureCookies,
      requireAuth,
      rateLimit: authLimiter,
    }),
  )

  app.use(notFound)
  app.use(errorHandler)

  return app
}
