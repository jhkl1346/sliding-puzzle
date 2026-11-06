import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

// pg 드라이버는 기본값이 "접속을 무한정 기다림"이라, Neon이 잠들었다 깨어나는 동안
// 첫 접속이 응답을 못 받으면 서버가 오류도 없이 멈춘다. 그래서 대기 시간을 제한한다.
const CONNECTION_TIMEOUT_MS = 10_000

export function createPrisma(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    }),
  })
}

// DB가 응답할 때까지 몇 번 다시 시도한다. (Neon은 한동안 안 쓰면 잠들었다가 첫 접속 때 깨어난다)
export async function waitForDatabase(
  prisma: PrismaClient,
  { attempts = 3, delayMs = 2000, log = console.log } = {},
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    log(`DB에 연결하는 중… (${attempt}/${attempts})`)
    try {
      await prisma.$queryRaw`SELECT 1`
      return
    } catch (error) {
      if (attempt === attempts) throw error
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
