import type { Credentials, PublicUser } from '@sliding-puzzle/shared'
import { ApiError, apiRequest } from './client'

// 로그인하지 않았으면 null
export async function fetchMe(): Promise<PublicUser | null> {
  try {
    const { user } = await apiRequest<{ user: PublicUser }>('/api/auth/me')
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
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
