import 'dotenv/config'
import { createApp } from './app'
import { createPrisma } from './db'
import { loadEnv } from './env'

const env = loadEnv()
const prisma = createPrisma(env.DATABASE_URL)

// 시작할 때 간단한 쿼리를 한 번 보내 봐서, 주소가 틀렸으면 바로 알 수 있게 한다.
// (드라이버 어댑터를 쓰면 $connect()만으로는 실제로 접속하지 않는다)
try {
  await prisma.$queryRaw`SELECT 1`
} catch (error) {
  console.error('DB에 접속하지 못했어요. server/.env의 DATABASE_URL을 확인해 주세요.')
  throw error
}

const app = createApp({
  prisma,
  clientOrigin: env.CLIENT_ORIGIN,
  jwtSecret: env.JWT_SECRET,
  // 배포 환경(HTTPS)에서는 Secure 쿠키만 쓴다. 로컬 개발(http)에서는 끈다.
  secureCookies: env.NODE_ENV === 'production',
})

const server = app.listen(env.PORT, () => {
  console.log(`서버 실행 중: http://localhost:${env.PORT}`)
})

// Ctrl+C나 배포 서비스의 종료 신호를 받으면 DB 연결을 정리하고 끝낸다.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0))
    })
  })
}
