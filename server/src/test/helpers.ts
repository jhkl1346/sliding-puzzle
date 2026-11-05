import { randomUUID } from 'node:crypto'
import type { Express } from 'express'
import request from 'supertest'
import { inject } from 'vitest'
import { type AppOptions, createApp } from '../app'
import { createPrisma } from '../db'

export const TEST_CLIENT_ORIGIN = 'http://localhost:5173'
export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long'

// 테스트 DB에 연결된 앱. 해시 강도를 낮추고 요청 제한을 넉넉하게 해서 빠르게 돌린다.
export function createTestApp(overrides: Partial<AppOptions> = {}) {
  const prisma = createPrisma(inject('testDatabaseUrl'))
  const app = createApp({
    prisma,
    clientOrigin: TEST_CLIENT_ORIGIN,
    jwtSecret: TEST_JWT_SECRET,
    secureCookies: false,
    bcryptRounds: 4,
    authRateLimit: { windowMs: 60_000, limit: 1000 },
    ...overrides,
  })
  return { app, prisma }
}

// DB를 쓰지 않는 테스트용 앱. (Prisma는 실제로 쿼리할 때만 접속하므로 가짜 주소여도 된다)
export function createAppWithoutDb(overrides: Partial<AppOptions> = {}) {
  return createApp({
    prisma: createPrisma('postgresql://unused:unused@localhost:5432/unused_test'),
    clientOrigin: TEST_CLIENT_ORIGIN,
    jwtSecret: TEST_JWT_SECRET,
    secureCookies: false,
    ...overrides,
  })
}

// 테스트 파일이 동시에 돌아도 겹치지 않는 아이디
export function uniqueUsername(): string {
  return `u_${randomUUID().replaceAll('-', '').slice(0, 12)}`
}

export const VALID_PASSWORD = 'correct-horse-1'

// 새 계정으로 가입해서, 로그인 쿠키를 기억하는 클라이언트를 돌려준다.
export async function loggedInAgent(app: Express) {
  const agent = request.agent(app)
  const res = await agent
    .post('/api/auth/register')
    .send({ username: uniqueUsername(), password: VALID_PASSWORD })
  if (res.status !== 201) throw new Error(`가입 실패: ${res.status}`)
  return { agent, userId: res.body.user.id as string }
}
