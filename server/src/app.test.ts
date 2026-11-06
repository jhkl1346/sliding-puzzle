import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createAppWithoutDb, TEST_CLIENT_ORIGIN } from './test/helpers'

const CLIENT_ORIGIN = TEST_CLIENT_ORIGIN
const app = createAppWithoutDb()

describe('GET /api/health', () => {
  it('200과 상태를 돌려준다', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('helmet 보안 헤더를 붙이고, Express 사용 사실은 숨긴다', async () => {
    const res = await request(app).get('/api/health')

    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})

describe('CORS', () => {
  it('허용한 클라이언트 주소에는 쿠키를 함께 쓸 수 있게 허용한다', async () => {
    const res = await request(app).get('/api/health').set('Origin', CLIENT_ORIGIN)

    expect(res.headers['access-control-allow-origin']).toBe(CLIENT_ORIGIN)
    expect(res.headers['access-control-allow-credentials']).toBe('true')
  })

  it('다른 주소에는 허용 헤더를 주지 않는다', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com')

    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com')
  })
})

describe('오류 응답', () => {
  it('없는 주소는 404와 통일된 오류 형식을 돌려준다', async () => {
    const res = await request(app).get('/api/nothing-here')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: expect.any(String) },
    })
  })

  it('JSON이 깨진 요청은 400 INVALID_JSON을 돌려준다', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"size": 3')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_JSON')
  })

  it('너무 큰 요청 본문은 413 PAYLOAD_TOO_LARGE를 돌려준다', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ moveLog: Array.from({ length: 60_000 }, () => 1) }))

    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE')
  })
})

describe('API 전체 요청 제한', () => {
  it('제한을 넘으면 429이고, 헬스체크는 제한에 걸리지 않는다', async () => {
    const limited = createAppWithoutDb({ apiRateLimit: { windowMs: 60_000, limit: 2 } })

    expect((await request(limited).get('/api/nothing')).status).toBe(404)
    expect((await request(limited).get('/api/nothing')).status).toBe(404)
    const third = await request(limited).get('/api/nothing')

    expect(third.status).toBe(429)
    expect(third.body.error.code).toBe('TOO_MANY_REQUESTS')
    expect((await request(limited).get('/api/health')).status).toBe(200)
  })

  it('trust proxy를 켜면 프록시가 알려준 사용자 IP마다 따로 센다', async () => {
    const behindProxy = createAppWithoutDb({
      apiRateLimit: { windowMs: 60_000, limit: 1 },
      trustProxy: 1,
    })
    const from = (ip: string) => request(behindProxy).get('/api/nothing').set('X-Forwarded-For', ip)

    expect((await from('203.0.113.1')).status).toBe(404)
    expect((await from('203.0.113.2')).status).toBe(404) // 다른 사용자
    expect((await from('203.0.113.1')).status).toBe(429) // 같은 사용자 두 번째
  })

  it('trust proxy를 끄면 X-Forwarded-For를 믿지 않아서 속일 수 없다', async () => {
    const direct = createAppWithoutDb({ apiRateLimit: { windowMs: 60_000, limit: 1 } })
    const from = (ip: string) => request(direct).get('/api/nothing').set('X-Forwarded-For', ip)

    expect((await from('203.0.113.1')).status).toBe(404)
    // 헤더로 다른 IP인 척해도 실제 접속 IP는 같으므로 막힌다.
    expect((await from('203.0.113.99')).status).toBe(429)
  })
})
