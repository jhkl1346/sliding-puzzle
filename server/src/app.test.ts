import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('GET /api/health', () => {
  it('200과 상태를 돌려준다', async () => {
    const res = await request(createApp()).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
