import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/hooks/useAuthPassword'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

type View = 'login' | 'forgot' | 'reset'

const demoRows = [
  { role: 'Admin', user: 'admin', pass: 'Admin@123!', roleClass: 'text-role-admin' },
  { role: 'Manager', user: 'mgr_us', pass: 'Manager@123!', roleClass: 'text-role-manager' },
  { role: 'User', user: 'user_us_ar', pass: 'User@1234!', roleClass: 'text-role-user' },
] as const

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})

const passwordRules = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a digit')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character')

const resetSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordRules,
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type LoginValues = z.infer<typeof loginSchema>
type ForgotValues = z.infer<typeof forgotSchema>
type ResetValues = z.infer<typeof resetSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [view, setView] = useState<View>('login')
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [demoToken, setDemoToken] = useState('')
  const [showResetPass, setShowResetPass] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const forgotPasswordMutation = useForgotPasswordMutation()
  const resetPasswordMutation = useResetPasswordMutation()

  const {
    register: loginReg,
    handleSubmit: loginSubmit,
    setValue: loginSetValue,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const {
    register: forgotReg,
    handleSubmit: forgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const {
    register: resetReg,
    handleSubmit: resetSubmit,
    setValue: resetSetValue,
    formState: { errors: resetErrors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: '', password: '', confirm: '' },
  })

  const handleLogin = async (data: LoginValues) => {
    setLoginError('')
    const result = await login(data.username.trim(), data.password)
    if (result.success) {
      toast.success('Welcome back!')
      const routes: Record<string, string> = { admin: '/admin', manager: '/manager', user: '/user' }
      navigate(routes[result.role] ?? '/user')
    } else {
      setLoginError(result.error)
    }
  }

  const handleForgot = async (data: ForgotValues) => {
    try {
      const res = await forgotPasswordMutation.mutateAsync(data.email.trim())
      if (res.demo_token) {
        setDemoToken(res.demo_token)
        resetSetValue('token', res.demo_token)
        toast.success('Reset token generated')
      } else {
        toast.success(res.message)
      }
    } catch {
      toast.error('Request failed')
    }
  }

  const handleReset = async (data: ResetValues) => {
    try {
      await resetPasswordMutation.mutateAsync({ token: data.token, new_password: data.password })
      setResetDone(true)
      toast.success('Password reset! You can now sign in.')
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
      toast.error(typeof detail === 'string' ? detail : 'Reset failed')
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-surface-base">
      <div className="absolute top-4 right-4 z-20 md:top-6 md:right-6">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-[0.04]"
          aria-hidden
        >
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00d4bf" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute -top-[20%] -right-[10%] size-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,212,191,0.06)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[20%] -left-[10%] size-[500px] rounded-full bg-[radial-gradient(circle,rgba(77,166,255,0.05)_0%,transparent_70%)]" />
      </div>

      <div
        className={cn(
          'hidden min-[900px]:flex min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:justify-center',
          'border-line border-r bg-[linear-gradient(135deg,var(--bg-surface)_0%,var(--bg-base)_100%)]',
          'px-16 py-20',
        )}
      >
        <div className="mb-16">
          <div className="mb-12 flex items-center gap-3.5">
            <div className="rounded-lg-hg border border-line-accent bg-brand-accent-glow p-3">
              <Shield className="size-7 text-brand-accent" aria-hidden />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-fg-primary">
              HealthGuard
            </span>
          </div>
          <h1 className="mb-6 font-display text-5xl leading-[1.1] font-extrabold tracking-[-0.03em] text-fg-primary">
            Secure
            <br />
            Healthcare
            <br />
            <span className="text-brand-accent">Platform</span>
          </h1>
          <p className="max-w-[380px] text-base leading-relaxed text-fg-secondary">
            Enterprise-grade patient data management with AES-256 encryption, role-based access controls,
            and full HIPAA compliance.
          </p>
        </div>

        {/* {[
          { icon: '🔐', text: 'AES-256-GCM field-level encryption' },
          { icon: '🌍', text: 'Multi-location & team support' },
          { icon: '📋', text: 'Complete audit trail logging' },
          { icon: '⚡', text: 'Real-time data management' },
        ].map((f) => (
          <div key={f.text} className="flex items-center gap-3 border-b border-line py-3">
            <span className="text-lg">{f.icon}</span>
            <span className="text-sm text-fg-secondary">{f.text}</span>
          </div>
        ))} */}
      </div>

      <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center px-8 py-10">
        <div className="animate-fade-in-hg">
          <div className="mb-12 flex items-center gap-3">
            <div className="rounded-lg-hg border border-line-accent bg-brand-accent-glow p-2.5">
              <Shield className="size-[22px] text-brand-accent" aria-hidden />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-fg-primary">
              HealthGuard
            </span>
          </div>

          {/* ── Login view ── */}
          {view === 'login' && (
            <>
              <h2 className="mb-2 font-display text-[32px] font-extrabold tracking-tight text-fg-primary">
                Sign in
              </h2>
              <p className="mb-10 text-sm text-fg-secondary">Enter your credentials to access your dashboard</p>

              <form className="flex flex-col gap-4" onSubmit={loginSubmit(handleLogin)}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login-username">Username or Email</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="e.g. admin or mgr_us"
                    autoComplete="username"
                    autoFocus
                    aria-invalid={!!loginErrors.username}
                    {...loginReg('username')}
                  />
                  {loginErrors.username && (
                    <p className="text-xs text-semantic-danger">{loginErrors.username.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-[12px] text-brand-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Your password"
                      autoComplete="current-password"
                      aria-invalid={!!loginErrors.password}
                      {...loginReg('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute top-1/2 right-3 flex -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-semantic-danger">{loginErrors.password.message}</p>
                  )}
                </div>

                {loginError ? (
                  <div className="animate-fade-in-hg flex items-center gap-2 rounded-md border border-semantic-danger/30 bg-semantic-danger-bg px-3.5 py-2.5">
                    <AlertCircle className="size-3.5 shrink-0 text-semantic-danger" aria-hidden />
                    <span className="text-[13px] text-semantic-danger">{loginError}</span>
                  </div>
                ) : null}

                <Button type="submit" size="lg" loading={isLoading} className="mt-1 w-full">
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-4 rounded-lg-hg border border-line bg-surface-elevated p-5">
                <p className="mb-3 text-xs font-semibold tracking-wide text-fg-muted uppercase">
                  Demo Credentials
                </p>
                {demoRows.map((c) => (
                  <div
                    key={c.role}
                    className="mb-1 flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 transition-colors duration-hg ease-hg last:mb-0 hover:bg-surface-hover"
                    onClick={() => {
                      loginSetValue('username', c.user)
                      loginSetValue('password', c.pass)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        loginSetValue('username', c.user)
                        loginSetValue('password', c.pass)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={cn('text-xs font-semibold', c.roleClass)}>{c.role}</span>
                    <span className="font-mono text-[11px] text-fg-muted">
                      {c.user} / {c.pass}
                    </span>
                  </div>
                ))}
                <p className="mt-2 text-[11px] text-fg-muted">Click a row to auto-fill credentials</p>
              </div>
            </>
          )}

          {/* ── Forgot password view ── */}
          {view === 'forgot' && (
            <>
              <button
                type="button"
                onClick={() => { setView('login'); setDemoToken('') }}
                className="mb-8 flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg-primary"
              >
                <ArrowLeft className="size-4" /> Back to sign in
              </button>
              <h2 className="mb-2 font-display text-[28px] font-extrabold tracking-tight text-fg-primary">
                Forgot password
              </h2>
              <p className="mb-8 text-sm text-fg-secondary">
                Enter your email address and we'll generate a reset token.
              </p>

              <form className="flex flex-col gap-5" onSubmit={forgotSubmit(handleForgot)}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="forgot-email">Email address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@healthguard.io"
                    autoFocus
                    aria-invalid={!!forgotErrors.email}
                    {...forgotReg('email')}
                  />
                  {forgotErrors.email && (
                    <p className="text-xs text-semantic-danger">{forgotErrors.email.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  loading={forgotPasswordMutation.isPending}
                  className="w-full"
                >
                  {forgotPasswordMutation.isPending ? 'Generating…' : 'Generate Reset Token'}
                </Button>
              </form>

              {demoToken && (
                <div className="mt-6 rounded-lg-hg border border-semantic-info/25 bg-semantic-info-bg p-4">
                  <p className="mb-1 text-[12px] font-semibold text-semantic-info">
                    Demo: Reset token (would be emailed in production)
                  </p>
                  <code className="block break-all text-[11px] text-fg-secondary">{demoToken}</code>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => { resetSetValue('token', demoToken); setView('reset') }}
                  >
                    Continue to reset password →
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── Reset password view ── */}
          {view === 'reset' && (
            <>
              <button
                type="button"
                onClick={() => setView('forgot')}
                className="mb-8 flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg-primary"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <h2 className="mb-2 font-display text-[28px] font-extrabold tracking-tight text-fg-primary">
                Reset password
              </h2>
              <p className="mb-8 text-sm text-fg-secondary">
                Paste your reset token and choose a new password.
              </p>

              {resetDone ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <CheckCircle2 className="size-12 text-semantic-success" />
                  <p className="font-display text-lg font-bold text-fg-primary">Password reset!</p>
                  <p className="text-sm text-fg-secondary">You can now sign in with your new password.</p>
                  <Button onClick={() => { setView('login'); setResetDone(false) }}>
                    Go to sign in
                  </Button>
                </div>
              ) : (
                <form className="flex flex-col gap-5" onSubmit={resetSubmit(handleReset)}>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reset-token">Reset token</Label>
                    <Input
                      id="reset-token"
                      type="text"
                      placeholder="Paste token here"
                      aria-invalid={!!resetErrors.token}
                      {...resetReg('token')}
                    />
                    {resetErrors.token && (
                      <p className="text-xs text-semantic-danger">{resetErrors.token.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reset-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="reset-password"
                        type={showResetPass ? 'text' : 'password'}
                        placeholder="Min 8 chars, upper, lower, digit, special"
                        aria-invalid={!!resetErrors.password}
                        {...resetReg('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPass(v => !v)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showResetPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {resetErrors.password && (
                      <p className="text-xs text-semantic-danger">{resetErrors.password.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reset-confirm">Confirm new password</Label>
                    <Input
                      id="reset-confirm"
                      type="password"
                      placeholder="Repeat new password"
                      aria-invalid={!!resetErrors.confirm}
                      {...resetReg('confirm')}
                    />
                    {resetErrors.confirm && (
                      <p className="text-xs text-semantic-danger">{resetErrors.confirm.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    loading={resetPasswordMutation.isPending}
                    className="w-full"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting…' : 'Reset Password'}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
