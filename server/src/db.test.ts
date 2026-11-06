import { describe, expect, it, vi } from 'vitest'
import { waitForDatabase } from './db'
import type { PrismaClient } from './generated/prisma/client'

// 정해진 횟수만큼 실패한 뒤 성공하는 가짜 DB
function fakePrisma(failures: number) {
  let calls = 0
  const queryRaw = vi.fn<() => Promise<unknown[]>>(async () => {
    calls++
    if (calls <= failures) throw new Error('connection timeout')
    return [{ '?column?': 1 }]
  })
  return { prisma: { $queryRaw: queryRaw } as unknown as PrismaClient, queryRaw }
}

describe('waitForDatabase', () => {
  it('처음 몇 번 실패해도 다시 시도해서 연결한다', async () => {
    const { prisma, queryRaw } = fakePrisma(2)
    const log = vi.fn<(message: string) => void>()

    await waitForDatabase(prisma, { attempts: 3, delayMs: 0, log })

    expect(queryRaw).toHaveBeenCalledTimes(3)
    expect(log).toHaveBeenLastCalledWith('DB에 연결하는 중… (3/3)')
  })

  it('정해진 횟수를 모두 실패하면 마지막 오류를 던진다', async () => {
    const { prisma, queryRaw } = fakePrisma(5)

    await expect(
      waitForDatabase(prisma, { attempts: 3, delayMs: 0, log: () => {} }),
    ).rejects.toThrow('connection timeout')
    expect(queryRaw).toHaveBeenCalledTimes(3)
  })

  it('바로 연결되면 한 번만 확인한다', async () => {
    const { prisma, queryRaw } = fakePrisma(0)

    await waitForDatabase(prisma, { delayMs: 0, log: () => {} })

    expect(queryRaw).toHaveBeenCalledTimes(1)
  })
})
