import { describe, expect, it } from 'vitest'
import { credentialsSchema, passwordSchema, usernameSchema, utf8ByteLength } from './auth'

describe('utf8ByteLength', () => {
  it('글자 종류마다 UTF-8 바이트 수를 센다', () => {
    expect(utf8ByteLength('abc')).toBe(3)
    expect(utf8ByteLength('é')).toBe(2)
    expect(utf8ByteLength('가')).toBe(3)
    expect(utf8ByteLength('😀')).toBe(4)
    expect(utf8ByteLength('')).toBe(0)
  })
})

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('usernameSchema', () => {
  it('앞뒤 공백을 지우고 소문자로 바꾼다', () => {
    expect(usernameSchema.parse('  Puzzle_King ')).toBe('puzzle_king')
  })

  it('길이와 글자 종류를 검사한다', () => {
    expect(firstMessage(usernameSchema.safeParse('ab'))).toContain('3자 이상')
    expect(firstMessage(usernameSchema.safeParse('a'.repeat(21)))).toContain('20자 이하')
    expect(firstMessage(usernameSchema.safeParse('퍼즐왕'))).toContain('영문, 숫자')
    expect(firstMessage(usernameSchema.safeParse('a b c'))).toContain('영문, 숫자')
  })
})

describe('passwordSchema', () => {
  it('8자 이상이면 통과한다', () => {
    expect(passwordSchema.safeParse('password1').success).toBe(true)
  })

  it('8자보다 짧으면 거부한다', () => {
    expect(firstMessage(passwordSchema.safeParse('short'))).toContain('8자 이상')
  })

  it('72바이트를 넘으면 거부한다 (한글은 한 글자가 3바이트)', () => {
    expect(passwordSchema.safeParse('a'.repeat(72)).success).toBe(true)
    expect(passwordSchema.safeParse('a'.repeat(73)).success).toBe(false)
    expect(passwordSchema.safeParse('가'.repeat(24)).success).toBe(true)
    expect(passwordSchema.safeParse('가'.repeat(25)).success).toBe(false)
  })

  it('비밀번호는 공백을 지우지 않는다', () => {
    expect(passwordSchema.parse(' pass word ')).toBe(' pass word ')
  })
})

describe('credentialsSchema', () => {
  it('값이 빠지면 거부한다', () => {
    expect(credentialsSchema.safeParse({ username: 'player1' }).success).toBe(false)
    expect(credentialsSchema.safeParse({}).success).toBe(false)
  })
})
