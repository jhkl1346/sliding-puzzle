import type { Credentials, PublicUser } from '@sliding-puzzle/shared'
import { apiRequest } from './client'

// 로그인하지 않았으면 null (서버가 { user: null }로 돌려준다)
export async function fetchMe(): Promise<PublicUser | null> {
  const { user } = await apiRequest<{ user: PublicUser | null }>('/api/auth/me')
  return user
}

export async function login(credentials: Credentials): Promise<PublicUser> {
  const { user } = await apiRequest<{ user: PublicUser }>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  })
  return user
}

export async function register(credentials: Credentials): Promise<PublicUser> {
  const { user } = await apiRequest<{ user: PublicUser }>('/api/auth/register', {
    method: 'POST',
    body: credentials,
  })
  return user
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/api/auth/logout', { method: 'POST' })
}
