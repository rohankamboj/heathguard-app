import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/services/api'

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email).then((res) => res.data),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (params: { token: string; new_password: string }) =>
      authApi.resetPassword(params.token, params.new_password).then((res) => res.data),
  })
}
