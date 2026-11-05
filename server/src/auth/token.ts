import { jwtVerify, SignJWT } from 'jose'

export const TOKEN_COOKIE = 'token'
export const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7일

function keyFrom(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

// 사용자 id를 담은 JWT를 만든다. (비밀번호 같은 민감한 정보는 넣지 않는다)
export async function signToken(userId: string, secret: string): Promise<string> {
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + TOKEN_MAX_AGE_MS))
    .sign(keyFrom(secret))
}

// 서명과 만료 시간을 확인하고 사용자 id를 돌려준다. 잘못된 토큰이면 null.
export async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, keyFrom(secret), { algorithms: ['HS256'] })
    return payload.sub ?? null
  } catch {
    return null
  }
}
