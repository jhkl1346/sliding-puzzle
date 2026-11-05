import { z } from 'zod'

// 회원가입·로그인 입력 규칙. 클라이언트(폼 검사)와 서버(요청 검증)가 같은 규칙을 쓴다.

export const USERNAME_MIN = 3
export const USERNAME_MAX = 20
export const PASSWORD_MIN = 8
// bcrypt는 비밀번호 앞 72바이트만 쓰므로 그보다 길면 막는다. (한글은 한 글자가 3바이트)
export const PASSWORD_MAX_BYTES = 72

export const usernameSchema = z
  .string({ error: '아이디를 입력해 주세요.' })
  .trim()
  .min(USERNAME_MIN, `아이디는 ${USERNAME_MIN}자 이상이어야 해요.`)
  .max(USERNAME_MAX, `아이디는 ${USERNAME_MAX}자 이하여야 해요.`)
  .regex(/^[a-zA-Z0-9_]+$/, '아이디는 영문, 숫자, 밑줄(_)만 쓸 수 있어요.')
  // 대소문자만 다른 아이디를 같은 아이디로 본다.
  .toLowerCase()

// 문자열을 UTF-8로 바꿨을 때의 바이트 수 (브라우저와 Node 어디서나 쓸 수 있게 직접 센다)
export function utf8ByteLength(text: string): number {
  let bytes = 0
  for (const char of text) {
    const codePoint = char.codePointAt(0)!
    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4
  }
  return bytes
}

export const passwordSchema = z
  .string({ error: '비밀번호를 입력해 주세요.' })
  .min(PASSWORD_MIN, `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`)
  .refine((password) => utf8ByteLength(password) <= PASSWORD_MAX_BYTES, '비밀번호가 너무 길어요.')

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export type Credentials = z.infer<typeof credentialsSchema>

// API가 돌려주는 사용자 정보 (비밀번호 해시는 절대 포함하지 않는다)
export interface PublicUser {
  id: string
  username: string
}
