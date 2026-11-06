import { credentialsSchema } from '@sliding-puzzle/shared'
import { type CookieOptions, type RequestHandler, type Response, Router } from 'express'
import { signToken, TOKEN_COOKIE, TOKEN_MAX_AGE_MS, verifyToken } from '../auth/token'
import { validateBody } from '../middleware/validate'
import type { createAuthService } from '../services/authService'

interface AuthRouterDeps {
  authService: ReturnType<typeof createAuthService>
  jwtSecret: string
  secureCookies: boolean
  rateLimit: RequestHandler
}

export function createAuthRouter({
  authService,
  jwtSecret,
  secureCookies,
  rateLimit,
}: AuthRouterDeps) {
  const router = Router()

  // httpOnly: 브라우저 JS가 토큰을 읽지 못하게 한다. (XSS로 토큰을 훔쳐 가지 못함)
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
  }

  async function setTokenCookie(res: Response, userId: string) {
    const token = await signToken(userId, jwtSecret)
    res.cookie(TOKEN_COOKIE, token, { ...cookieOptions, maxAge: TOKEN_MAX_AGE_MS })
  }

  router.post('/register', rateLimit, validateBody(credentialsSchema), async (req, res) => {
    const user = await authService.register(req.body)
    await setTokenCookie(res, user.id)
    res.status(201).json({ user })
  })

  router.post('/login', rateLimit, validateBody(credentialsSchema), async (req, res) => {
    const user = await authService.login(req.body)
    await setTokenCookie(res, user.id)
    res.json({ user })
  })

  // 로그인이 이미 만료된 상태에서 눌러도 오류가 나지 않게, 로그인 여부와 상관없이 쿠키를 지운다.
  router.post('/logout', (_req, res) => {
    res.clearCookie(TOKEN_COOKIE, cookieOptions)
    res.status(204).end()
  })

  // "로그인했는지 확인"하는 용도라, 로그인하지 않은 상태도 정상 결과(user: null)로 돌려준다.
  // (401로 응답하면 첫 화면을 열 때마다 브라우저 콘솔에 오류가 남는다)
  // 쿠키가 없거나, 토큰이 위조·만료됐거나, 계정이 지워진 경우 모두 user: null이다.
  router.get('/me', async (req, res) => {
    const token: unknown = req.cookies?.[TOKEN_COOKIE]
    const userId = typeof token === 'string' ? await verifyToken(token, jwtSecret) : null
    const user = userId ? await authService.findUser(userId) : null
    res.json({ user })
  })

  return router
}
