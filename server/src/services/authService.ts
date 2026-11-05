import type { Credentials, PublicUser } from '@sliding-puzzle/shared'
import bcrypt from 'bcryptjs'
import { AppError } from '../errors'
import { Prisma, type PrismaClient } from '../generated/prisma/client'

const INVALID_CREDENTIALS = new AppError(
  401,
  'INVALID_CREDENTIALS',
  '아이디 또는 비밀번호가 틀렸어요.',
)

function toPublicUser(user: { id: string; username: string }): PublicUser {
  return { id: user.id, username: user.username }
}

export function createAuthService(prisma: PrismaClient, bcryptRounds: number) {
  // 없는 아이디로 로그인할 때도 해시 비교를 한 번 해서, 응답 시간으로 계정 존재 여부를 알 수 없게 한다.
  let dummyHash: string | undefined
  const getDummyHash = async () => (dummyHash ??= await bcrypt.hash('dummy-password', bcryptRounds))

  return {
    async register({ username, password }: Credentials): Promise<PublicUser> {
      const passwordHash = await bcrypt.hash(password, bcryptRounds)
      try {
        const user = await prisma.user.create({ data: { username, passwordHash } })
        return toPublicUser(user)
      } catch (error) {
        // username에 걸린 unique 제약 위반 = 이미 있는 아이디 (동시에 가입해도 DB가 막아 준다)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError(409, 'USERNAME_TAKEN', '이미 사용 중인 아이디예요.')
        }
        throw error
      }
    },

    async login({ username, password }: Credentials): Promise<PublicUser> {
      const user = await prisma.user.findUnique({ where: { username } })
      const ok = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()))
      if (!user || !ok) throw INVALID_CREDENTIALS
      return toPublicUser(user)
    },

    async findUser(userId: string): Promise<PublicUser | null> {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      return user ? toPublicUser(user) : null
    },
  }
}
