import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import { useAuth } from '../auth/auth-context'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'

interface LoginFormErrors {
  email?: string
  password?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const submittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const showDevelopmentAccounts =
    import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === 'true'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const nextErrors: LoginFormErrors = {}

    if (!email) nextErrors.email = 'Email is required.'
    if (!password) nextErrors.password = 'Password is required.'

    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      await login({ email, password })
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from && !['/login', '/register'].includes(from) ? from : '/dashboard', { replace: true })
    } catch (error) {
      setFormError(normalizeApiError(error).message)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to SkillSwap"
      description="Continue learning and sharing skills with your student community."
      footer={<>New to SkillSwap? <Link className="font-bold text-teal-700 underline decoration-teal-200 decoration-2 underline-offset-4 hover:text-teal-600" to="/register">Create an account</Link></>}
    >
      {formError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {formError}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <FormField id="email" name="email" label="Email address" type="email" autoComplete="email" inputMode="email" placeholder="you@university.edu" required error={errors.email} value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
        <FormField id="password" name="password" label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" required error={errors.password} value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
        <SubmitButton isSubmitting={isSubmitting} idleLabel="Sign in" submittingLabel="Signing in…" />
      </form>

      {showDevelopmentAccounts && (
        <aside className="mt-6 rounded-2xl border border-dashed border-teal-300 bg-teal-50/70 p-4" aria-labelledby="development-accounts-title">
          <p id="development-accounts-title" className="text-sm font-extrabold text-teal-900">Development accounts</p>
          <p className="mt-1 text-xs leading-5 text-teal-800">These helpers still sign in through the normal authentication API.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DevelopmentAccount label="Student" email="student@skillswap.test" onUse={() => { setEmail('student@skillswap.test'); setPassword('Password123!'); setErrors({}) }} />
            <DevelopmentAccount label="Admin" email="admin@skillswap.test" onUse={() => { setEmail('admin@skillswap.test'); setPassword('Password123!'); setErrors({}) }} />
          </div>
        </aside>
      )}
    </AuthLayout>
  )
}

function DevelopmentAccount({ label, email, onUse }: { label: string; email: string; onUse: () => void }) {
  return <div className="min-w-0 rounded-xl bg-white p-3 shadow-sm"><p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">{label}</p><p className="mt-2 break-all text-xs font-medium text-slate-600">{email}</p><p className="break-all text-xs text-slate-500">Password123!</p><button type="button" onClick={onUse} className="mt-3 min-h-10 w-full rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 outline-none hover:bg-teal-50 focus-visible:ring-4 focus-visible:ring-teal-100">Use {label} Account</button></div>
}
