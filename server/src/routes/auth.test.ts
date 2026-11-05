import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { signToken } from '../auth/token'
import {
  createAppWithoutDb,
  createTestApp,
  TEST_JWT_SECRET,
  uniqueUsername,
  VALID_PASSWORD,
} from '../test/helpers'

const { app, prisma } = createTestApp()

afterAll(async () => {
  await prisma.$disconnect()
})

function register(username: string, password = VALID_PASSWORD) {
  return request(app).post('/api/auth/register').send({ username, password })
}

function tokenCookie(res: request.Response): string {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined
  const cookie = cookies?.find((value) => value.startsWith('token='))
  if (!cookie) throw new Error('token 쿠키가 없어요.')
  return cookie
}

describe('POST /api/auth/register', () => {
  it('가입하면 201과 사용자 정보를 돌려주고, 로그인 쿠키를 준다', async () => {
    const username = uniqueUsername()
    const res = await register(username)

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ user: { id: expect.any(String), username } })
    expect(tokenCookie(res)).toMatch(/HttpOnly/)
  })

  it('아이디는 소문자로 저장하고, 비밀번호는 해시로만 저장한다', async () => {
    const username = uniqueUsername()
    const res = await register(username.toUpperCase())

    expect(res.body.user.username).toBe(username)
    const saved = await prisma.user.findUniqueOrThrow({ where: { username } })
    expect(saved.passwordHash).not.toBe(VALID_PASSWORD)
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$/) // bcrypt 해시 형식
  })

  it('응답에 비밀번호 해시를 넣지 않는다', async () => {
    const res = await register(uniqueUsername())

    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
    expect(JSON.stringify(res.body)).not.toContain(VALID_PASSWORD)
  })

  it('이미 있는 아이디는 409 USERNAME_TAKEN (대소문자만 달라도 같은 아이디)', async () => {
    const username = uniqueUsername()
    await register(username)

    const res = await register(username.toUpperCase())

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('USERNAME_TAKEN')
  })

  it('규칙에 맞지 않는 입력은 400 VALIDATION_ERROR와 이유를 돌려준다', async () => {
    const shortPassword = await register(uniqueUsername(), 'short')
    const badUsername = await register('퍼즐왕')
    const empty = await request(app).post('/api/auth/register').send({})

    expect(shortPassword.status).toBe(400)
    expect(shortPassword.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: '비밀번호는 8자 이상이어야 해요.',
    })
    expect(badUsername.body.error.code).toBe('VALIDATION_ERROR')
    expect(empty.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('맞는 아이디와 비밀번호면 200과 로그인 쿠키를 준다', async () => {
    const username = uniqueUsername()
    await register(username)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password: VALID_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe(username)
    expect(tokenCookie(res)).toMatch(/HttpOnly/)
  })

  it('비밀번호가 틀리면 401, 없는 아이디도 같은 메시지로 응답한다', async () => {
    const username = uniqueUsername()
    await register(username)

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'wrong-password' })
    const noUser = await request(app)
      .post('/api/auth/login')
      .send({ username: uniqueUsername(), password: VALID_PASSWORD })

    expect(wrongPassword.status).toBe(401)
    expect(noUser.status).toBe(401)
    // 계정이 있는지 없는지 응답으로 구분할 수 없어야 한다.
    expect(wrongPassword.body).toEqual(noUser.body)
    expect(wrongPassword.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: '아이디 또는 비밀번호가 틀렸어요.',
    })
    expect(wrongPassword.headers['set-cookie']).toBeUndefined()
  })
})

describe('GET /api/auth/me', () => {
  it('로그인 쿠키가 있으면 내 정보를 돌려준다', async () => {
    const agent = request.agent(app) // 쿠키를 기억하는 클라이언트
    const username = uniqueUsername()
    await agent.post('/api/auth/register').send({ username, password: VALID_PASSWORD })

    const res = await agent.get('/api/auth/me')

    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe(username)
  })

  it('쿠키가 없으면 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('위조하거나 다른 키로 서명한 토큰은 거부한다', async () => {
    const res = await register(uniqueUsername())
    const forged = await signToken(res.body.user.id, 'another-secret-that-is-at-least-32-chars')

    const tampered = await request(app).get('/api/auth/me').set('Cookie', `token=${forged}`)
    const garbage = await request(app).get('/api/auth/me').set('Cookie', 'token=not-a-jwt')

    expect(tampered.status).toBe(401)
    expect(garbage.status).toBe(401)
  })

  it('토큰은 유효해도 계정이 지워졌으면 401', async () => {
    const res = await register(uniqueUsername())
    await prisma.user.delete({ where: { id: res.body.user.id } })

    const me = await request(app).get('/api/auth/me').set('Cookie', tokenCookie(res))

    expect(me.status).toBe(401)
  })

  it('정상 토큰도 서명 키가 같아야 통과한다 (테스트 키로 만든 토큰)', async () => {
    const res = await register(uniqueUsername())
    const token = await signToken(res.body.user.id, TEST_JWT_SECRET)

    const me = await request(app).get('/api/auth/me').set('Cookie', `token=${token}`)

    expect(me.status).toBe(200)
  })
})

describe('POST /api/auth/logout', () => {
  it('쿠키를 지워서, 그 뒤로는 내 정보를 볼 수 없다', async () => {
    const agent = request.agent(app)
    await agent
      .post('/api/auth/register')
      .send({ username: uniqueUsername(), password: VALID_PASSWORD })

    const logout = await agent.post('/api/auth/logout')
    const me = await agent.get('/api/auth/me')

    expect(logout.status).toBe(204)
    expect(me.status).toBe(401)
  })

  it('로그인하지 않은 상태에서도 오류 없이 204', async () => {
    const res = await request(createAppWithoutDb()).post('/api/auth/logout')

    expect(res.status).toBe(204)
  })
})

describe('로그인 쿠키 설정', () => {
  it('SameSite=Lax, Path=/, 7일 유지', async () => {
    const cookie = tokenCookie(await register(uniqueUsername()))

    expect(cookie).toMatch(/SameSite=Lax/)
    expect(cookie).toMatch(/Path=\//)
    expect(cookie).toMatch(/Max-Age=604800/)
    expect(cookie).not.toMatch(/Secure/)
  })

  it('secureCookies가 켜져 있으면 Secure 쿠키를 준다 (배포 환경)', async () => {
    const { app: secureApp, prisma: securePrisma } = createTestApp({ secureCookies: true })
    const res = await request(secureApp)
      .post('/api/auth/register')
      .send({ username: uniqueUsername(), password: VALID_PASSWORD })
    await securePrisma.$disconnect()

    expect(tokenCookie(res)).toMatch(/Secure/)
  })
})

describe('요청 횟수 제한', () => {
  it('제한을 넘으면 429 TOO_MANY_REQUESTS', async () => {
    const limited = createAppWithoutDb({ authRateLimit: { windowMs: 60_000, limit: 2 } })
    // 검증에 실패하는 요청도 횟수에 들어간다. (DB를 쓰지 않고 확인)
    const send = () => request(limited).post('/api/auth/login').send({})

    expect((await send()).status).toBe(400)
    expect((await send()).status).toBe(400)
    const third = await send()

    expect(third.status).toBe(429)
    expect(third.body.error.code).toBe('TOO_MANY_REQUESTS')
  })
})
