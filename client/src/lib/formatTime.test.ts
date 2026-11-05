import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('분:초.(0.1초) 형식으로 바꾼다', () => {
    expect(formatTime(0)).toBe('00:00.0')
    expect(formatTime(1234)).toBe('00:01.2')
    expect(formatTime(61_234)).toBe('01:01.2')
  })

  it('0.1초 아래는 버린다', () => {
    expect(formatTime(99)).toBe('00:00.0')
    expect(formatTime(59_999)).toBe('00:59.9')
  })

  it('1시간이 넘어도 분으로 센다', () => {
    expect(formatTime(3_725_000)).toBe('62:05.0')
  })
})
