import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { AppRoutes } from '../App'

export function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

type Handler = (body: unknown) => Response | Promise<Response>

// "메서드 주소" → 응답. 등록하지 않은 요청이 오면 테스트를 실패시킨다.
export function mockFetch(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`
    const handler = handlers[key]
    if (!handler) throw new Error(`예상하지 못한 요청: ${key}`)
    return handler(init?.body ? JSON.parse(String(init.body)) : undefined)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const NOT_LOGGED_IN: Handler = () =>
  jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: '로그인이 필요해요.' } })

// 서버 상태(TanStack Query)와 주소 이동(react-router)이 필요한 컴포넌트를 그린다.
export function renderWithProviders(ui: ReactNode, route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
  return { user }
}

// 실제 앱과 같은 화면 구성을 원하는 주소에서 시작한다.
export function renderApp(route = '/') {
  return renderWithProviders(<AppRoutes />, route)
}
