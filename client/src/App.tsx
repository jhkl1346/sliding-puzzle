import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Header } from './components/Header'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'

// 내 기록 페이지는 차트 라이브러리(Recharts)가 커서, 그 페이지를 열 때만 따로 내려받는다.
const RecordsPage = lazy(() =>
  import('./pages/RecordsPage').then((module) => ({ default: module.RecordsPage })),
)

function PageLoading() {
  return (
    <p role="status" className="py-10 text-center text-slate-600">
      불러오는 중…
    </p>
  )
}

// 화면 주소와 페이지 연결. 테스트에서는 MemoryRouter로 감싸서 쓴다.
export function AppRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route
          path="/records"
          element={
            <Suspense fallback={<PageLoading />}>
              <RecordsPage />
            </Suspense>
          }
        />
      </Routes>
    </>
  )
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
