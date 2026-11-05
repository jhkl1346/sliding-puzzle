import { describe, expect, it } from 'vitest'
import { loadEnv } from './env'

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/sliding_puzzle'
const JWT_SECRET = 'x'.repeat(32)
const required = { DATABASE_URL, JWT_SECRET }

describe('loadEnv', () => {
  it('빠진 값은 기본값으로 채운다', () => {
    expect(loadEnv(required)).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL,
      JWT_SECRET,
      CLIENT_ORIGIN: 'http://localhost:5173',
    })
  })

  it('PORT 문자열을 숫자로 바꾼다', () => {
    expect(loadEnv({ ...required, PORT: '4000' }).PORT).toBe(4000)
  })

  it('DATABASE_URL이 없으면 알아보기 쉬운 오류를 낸다', () => {
    expect(() => loadEnv({ JWT_SECRET })).toThrow('DATABASE_URL')
  })

  it('JWT_SECRET이 없거나 32자보다 짧으면 오류를 낸다', () => {
    expect(() => loadEnv({ DATABASE_URL })).toThrow('JWT_SECRET')
    expect(() => loadEnv({ DATABASE_URL, JWT_SECRET: 'too-short' })).toThrow('32자 이상')
  })

  it('잘못된 값이면 오류를 낸다', () => {
    expect(() => loadEnv({ ...required, PORT: 'abc' })).toThrow('PORT')
    expect(() => loadEnv({ ...required, CLIENT_ORIGIN: 'not-a-url' })).toThrow('CLIENT_ORIGIN')
  })
})
