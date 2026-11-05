import type { RequestHandler } from 'express'
import type { z } from 'zod'
import { AppError } from '../errors'

// 요청 본문을 Zod 스키마로 검사하고, 통과하면 정리된 값으로 바꿔 넣는다.
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '요청 내용이 올바르지 않아요.'
      throw new AppError(400, 'VALIDATION_ERROR', message)
    }
    req.body = result.data
    next()
  }
}
