import {
  type Credentials,
  credentialsSchema,
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
} from '@sliding-puzzle/shared'
import { type FormEvent, useId, useState } from 'react'

type FieldErrors = Partial<Record<keyof Credentials, string>>

interface AuthFormProps {
  mode: 'login' | 'register'
  submitting: boolean
  // 서버가 돌려준 오류 메시지
  serverError: string | null
  onSubmit: (credentials: Credentials) => void
}

export function AuthForm({ mode, submitting, serverError, onSubmit }: AuthFormProps) {
  const id = useId()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isRegister = mode === 'register'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    // 서버와 같은 규칙(shared)으로 먼저 검사해서, 잘못된 입력은 보내기 전에 알려준다.
    const result = credentialsSchema.safeParse({
      username: form.get('username'),
      password: form.get('password'),
    })
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof Credentials
        errors[field] ??= issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    onSubmit(result.data)
  }

  const fields = [
    {
      name: 'username' as const,
      label: '아이디',
      type: 'text',
      autoComplete: 'username',
      hint: isRegister ? `영문, 숫자, 밑줄(_) ${USERNAME_MIN}~${USERNAME_MAX}자` : undefined,
    },
    {
      name: 'password' as const,
      label: '비밀번호',
      type: 'password',
      autoComplete: isRegister ? 'new-password' : 'current-password',
      hint: isRegister ? `${PASSWORD_MIN}자 이상` : undefined,
    },
  ]

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {fields.map(({ name, label, type, autoComplete, hint }) => {
        const error = fieldErrors[name]
        const describedBy = [hint && `${id}-${name}-hint`, error && `${id}-${name}-error`]
          .filter(Boolean)
          .join(' ')
        return (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={`${id}-${name}`} className="font-semibold">
              {label}
            </label>
            <input
              id={`${id}-${name}`}
              name={name}
              type={type}
              autoComplete={autoComplete}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 focus-visible:border-sky-600 focus-visible:outline-none aria-invalid:border-red-600"
            />
            {hint && (
              <p id={`${id}-${name}-hint`} className="text-sm text-slate-600">
                {hint}
              </p>
            )}
            {error && (
              <p id={`${id}-${name}-error`} className="text-sm font-medium text-red-700">
                {error}
              </p>
            )}
          </div>
        )
      })}

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="cursor-pointer rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 focus-visible:ring-4 focus-visible:ring-sky-300 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? '잠시만요…' : isRegister ? '회원가입' : '로그인'}
      </button>
    </form>
  )
}
