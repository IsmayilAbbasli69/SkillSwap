import type { ComponentProps, ReactNode } from 'react'

interface FormFieldProps extends ComponentProps<'input'> {
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
}

export function FormField({
  id,
  label,
  hint,
  error,
  optional = false,
  className = '',
  ...inputProps
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-sm font-bold text-ink">
        <span>{label}</span>
        {optional ? (
          <span className="text-xs font-medium text-slate-500">Optional</span>
        ) : inputProps.required ? (
          <span className="text-xs font-medium text-teal-700">Required</span>
        ) : null}
      </label>
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${error ? 'border-red-400' : 'border-slate-200'} ${className}`}
        {...inputProps}
      />
      {hint && <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{error}</p>}
    </div>
  )
}
