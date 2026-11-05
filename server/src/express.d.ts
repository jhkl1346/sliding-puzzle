import 'express'

// requireAuth를 통과한 요청에는 로그인한 사용자 id가 붙는다.
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string
  }
}
