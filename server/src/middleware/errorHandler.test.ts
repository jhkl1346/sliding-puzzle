import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../errors'
import { errorHandler } from './errorHandler'

// 일부러 오류를 던지는 라우트만 있는 작은 앱
function appThatThrows(error: unknown) {
  const app = express()
  app.get('/boom', () => {
    throw error
  })
  app.use(errorHandler)
  return app
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('errorHandler', () => {
  it('AppError는 정한 상태 코드와 코드·메시지로 응답한다', async () => {
    const res = await request(
      appThatThrows(new AppError(409, 'ALREADY_FINISHED', '이미 끝난 게임이에요.')),
    ).get('/boom')

    expect(res.status).toBe(409)
    expect(res.body).toEqual({
      error: { code: 'ALREADY_FINISHED', message: '이미 끝난 게임이에요.' },
    })
  })

  it('예상하지 못한 오류는 500으로 응답하고, 내부 내용은 응답에 넣지 않는다', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await request(appThatThrows(new Error('DB 비밀 정보가 담긴 메시지'))).get('/boom')

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
    expect(JSON.stringify(res.body)).not.toContain('DB 비밀 정보')
    expect(log).toHaveBeenCalled()
  })
})
