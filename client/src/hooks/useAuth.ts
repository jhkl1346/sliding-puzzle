import type { PublicUser } from '@sliding-puzzle/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMe, login, logout, register } from '../api/auth'

const ME_QUERY_KEY = ['auth', 'me'] as const

// 현재 로그인한 사용자. data가 null이면 로그인하지 않은 상태다.
export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  })
}

// 로그인·회원가입·로그아웃이 성공하면 "내 정보" 캐시를 바로 바꿔서 화면이 다시 요청하지 않고 갱신되게 한다.
function useSetMe() {
  const queryClient = useQueryClient()
  return (user: PublicUser | null) => queryClient.setQueryData(ME_QUERY_KEY, user)
}

export function useLogin() {
  const setMe = useSetMe()
  return useMutation({ mutationFn: login, onSuccess: setMe })
}

export function useRegister() {
  const setMe = useSetMe()
  return useMutation({ mutationFn: register, onSuccess: setMe })
}

export function useLogout() {
  const setMe = useSetMe()
  return useMutation({ mutationFn: logout, onSuccess: () => setMe(null) })
}
