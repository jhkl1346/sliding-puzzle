// 서버가 { error: { code, message } } 형식으로 돌려준 오류
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
}

// 서버 API 요청. 실패하면 화면에 보여 줄 메시지가 담긴 ApiError를 던진다.
export async function apiRequest<T>(
  path: string,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      // 로그인 쿠키를 함께 보낸다.
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.')
  }

  if (res.status === 204) return undefined as T

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string } } | null)?.error
    throw new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? '알 수 없는 오류가 생겼어요. 잠시 후 다시 시도해 주세요.',
    )
  }
  return data as T
}
