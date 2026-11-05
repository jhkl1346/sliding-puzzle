import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'dotenv'
import type { TestProject } from 'vitest/node'
import { createPrisma } from '../db'

const serverDir = fileURLToPath(new URL('../..', import.meta.url))

declare module 'vitest' {
  export interface ProvidedContext {
    testDatabaseUrl: string
  }
}

function readServerEnv(): Record<string, string> {
  try {
    return parse(readFileSync(`${serverDir}.env`))
  } catch {
    return {}
  }
}

// 개발 DB를 실수로 지우지 않도록, 이름이 _test로 끝나는 DB에서만 테스트한다.
function assertTestDatabase(name: string, url: string | undefined): string {
  if (!url) {
    throw new Error(
      `${name}가 없어요. server/.env에 테스트 전용 DB 주소를 넣어 주세요. (README의 실행 방법 참고)`,
    )
  }
  const database = new URL(url).pathname.slice(1)
  if (!database.endsWith('_test')) {
    throw new Error(
      `${name}의 DB 이름(${database})이 _test로 끝나지 않아요. 개발 DB일 수 있어 멈춰요.`,
    )
  }
  return url
}

// 서버 테스트를 시작하기 전에 한 번 실행된다: 테스트 DB에 마이그레이션을 적용하고 비운다.
export default async function setup(project: TestProject) {
  const fileEnv = readServerEnv()
  const databaseUrl = assertTestDatabase(
    'TEST_DATABASE_URL',
    process.env.TEST_DATABASE_URL ?? fileEnv.TEST_DATABASE_URL,
  )
  const directUrl = assertTestDatabase(
    'TEST_DIRECT_URL',
    process.env.TEST_DIRECT_URL ?? fileEnv.TEST_DIRECT_URL ?? databaseUrl,
  )

  execSync('npx prisma migrate deploy', {
    cwd: serverDir,
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl },
    stdio: 'pipe',
  })

  const prisma = createPrisma(databaseUrl)
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Game", "User" CASCADE')
  await prisma.$disconnect()

  project.provide('testDatabaseUrl', databaseUrl)
}
