// Prisma는 .env를 자동으로 읽지 않으므로 여기서 먼저 불러온다.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // 마이그레이션은 연결 풀(pooler)을 거치지 않는 직접 주소로 해야 안전하다. 없으면 DATABASE_URL을 쓴다.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
