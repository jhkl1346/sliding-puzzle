import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError, errorBody } from '../errors'

// 어느 라우트에도 맞지 않는 요청
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(errorBody('NOT_FOUND', '요청한 주소를 찾을 수 없어요.'))
}

// express.json()이 본문을 읽다가 내는 오류에 붙는 type 값
function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') {
    return err.type
  }
  return undefined
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(errorBody(err.code, err.message))
    return
  }

  switch (bodyParserErrorType(err)) {
    case 'entity.parse.failed':
      res.status(400).json(errorBody('INVALID_JSON', '요청 본문이 올바른 JSON이 아니에요.'))
      return
    case 'entity.too.large':
      res.status(413).json(errorBody('PAYLOAD_TOO_LARGE', '요청 본문이 너무 커요.'))
      return
  }

  // 예상하지 못한 오류는 자세한 내용을 숨기고 서버 로그에만 남긴다. (요청 본문은 비밀번호가 있을 수 있어 남기지 않음)
  console.error(`[${req.method} ${req.originalUrl}]`, err)
  res
    .status(500)
    .json(errorBody('INTERNAL_ERROR', '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'))
}
