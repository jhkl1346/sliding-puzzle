import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url({ message: 'DATABASE_URL에 PostgreSQL 접속 주소를 넣어 주세요.' }),
  // JWT 서명용 비밀 키. 짧으면 추측당하기 쉬우므로 32자 이상만 허용한다.
  JWT_SECRET: z
    .string({ message: 'JWT_SECRET을 넣어 주세요.' })
    .min(32, 'JWT_SECRET은 32자 이상이어야 해요.'),
  // 쿠키 인증을 허용할 클라이언트 주소 (CORS)
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  // 앞단 프록시를 몇 단계까지 믿을지 (배포: Vercel → Render 구조라 보통 1 이상, 로컬: 0)
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
})

export type Env = z.infer<typeof envSchema>

// 환경변수를 검사해서, 빠졌거나 잘못된 값이 있으면 서버를 띄우기 전에 바로 알려준다.
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    throw new Error(`환경변수가 올바르지 않아요.\n${z.prettifyError(result.error)}`)
  }
  return result.data
}
