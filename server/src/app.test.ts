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
