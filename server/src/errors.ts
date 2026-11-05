// 클라이언트에 그대로 보여 줘도 되는 오류. 에러 핸들러가 { error: { code, message } } 형식으로 바꿔 응답한다.
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export interface ErrorBody {
  error: { code: string; message: string }
}

export function errorBody(code: string, message: string): ErrorBody {
  return { error: { code, message } }
}
