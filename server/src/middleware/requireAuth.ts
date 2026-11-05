import type { RequestHandler } from 'express'
import { TOKEN_COOKIE, verifyToken } from '../auth/token'
import { AppError } from '../errors'

// 쿠키의 JWT를 확인해서, 로그인한 요청만 다음으로 넘긴다.
export function createRequireAuth(jwtSecret: string): RequestHandler {
  return async (req, _res, next) => {
    const token: unknown = req.cookies?.[TOKEN_COOKIE]
    const userId = typeof token === 'string' ? await verifyToken(token, jwtSecret) : null

    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', '로그인이 필요해요.')
    }

    req.userId = userId
    next()
  }
}
