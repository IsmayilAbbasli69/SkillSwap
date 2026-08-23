import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import type { SignupInput } from '../api/types'
import { useAuth } from '../auth/auth-context'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { SubmitButton } from '../components/SubmitButton'

type RequiredField = 'email' | 'password' | 'firstName' | 'lastName'
type RegisterErrors = Partial<Record<RequiredField | 'academicYear', string>>

export function RegisterPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const submittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<RegisterErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const formData = new FormData(event.currentTarget)
    const requiredValues: Record<RequiredField, string> = {
      email: String(formData.get('email') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      firstName: String(formData.get('firstName') ?? '').trim(),
      lastName: String(formData.get('lastName') ?? '').trim(),
    }
    const academicYearValue = String(formData.get('academicYear') ?? '').trim()
    const nextErrors: RegisterErrors = {}

    if (!requiredValues.email) nextErrors.email = 'Email is required.'
    if (!requiredValues.password) nextErrors.password = 'Password is required.'
    if (!requiredValues.firstName) nextErrors.firstName = 'First name is required.'
    if (!requiredValues.lastName) nextErrors.lastName = 'Last name is required.'
    if (academicYearValue && !Number.isInteger(Number(academicYearValue))) {
      nextErrors.academicYear = 'Academic year must be a whole number.'
    }

    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    const optionalText = (name: string) => {
      const value = String(formData.get(name) ?? '').trim()
      return value || undefined
    }

    const input: SignupInput = {
      ...requiredValues,
      bio: optionalText('bio'),
      department: optionalText('department'),
      academicYear: academicYearValue ? Number(academicYearValue) : undefined,
      institutionId: optionalText('institutionId'),
      unitId: optionalText('unitId'),
    }

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      await signup(input)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(normalizeApiError(error).message)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      wide
      eyebrow="Join the community"
      title="Create your account"
      description="Required fields are marked below. Everything else can be added now or left blank."
      footer={<>Already have an account? <Link className="font-bold text-teal-700 underline decoration-teal-200 decoration-2 underline-offset-4 hover:text-teal-600" to="/login">Sign in</Link></>}
    >
      {formError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {formError}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Required account information</legend>
          <FormField id="firstName" name="firstName" label="First name" autoComplete="given-name" required error={errors.firstName} />
          <FormField id="lastName" name="lastName" label="Last name" autoComplete="family-name" required error={errors.lastName} />
          <FormField id="registerEmail" name="email" label="Email address" type="email" autoComplete="email" inputMode="email" placeholder="you@university.edu" required error={errors.email} />
          <FormField id="registerPassword" name="password" label="Password" type="password" autoComplete="new-password" required error={errors.password} />
        </fieldset>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-bold text-ink">About you <span className="ml-1 text-xs font-medium text-slate-500">Optional</span></h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <FormField id="department" name="department" label="Department" optional placeholder="Computer Science" />
            <FormField id="academicYear" name="academicYear" label="Academic year" optional type="number" inputMode="numeric" step="1" error={errors.academicYear} />
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="mb-2 flex items-baseline justify-between gap-3 text-sm font-bold text-ink">
                <span>Bio</span><span className="text-xs font-medium text-slate-500">Optional</span>
              </label>
              <textarea id="bio" name="bio" rows={3} placeholder="What do you enjoy learning or teaching?" className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
            </div>
          </div>
        </div>

        <fieldset className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <legend className="mb-1 font-bold text-ink">Institution details <span className="ml-1 text-xs font-medium text-slate-500">Optional</span></legend>
          <p className="sm:col-span-2 -mt-3 text-xs leading-5 text-slate-500">
            The API currently has no institution directory. If your institution provided these IDs, enter them here; otherwise leave them blank.
          </p>
          <FormField id="institutionId" name="institutionId" label="Institution ID" optional autoComplete="off" placeholder="UUID provided by your institution" />
          <FormField id="unitId" name="unitId" label="Unit ID" optional autoComplete="off" placeholder="UUID provided by your institution" />
        </fieldset>

        <SubmitButton isSubmitting={isSubmitting} idleLabel="Create account" submittingLabel="Creating account…" />
      </form>
    </AuthLayout>
  )
}
