interface SubmitButtonProps {
  isSubmitting: boolean
  idleLabel: string
  submittingLabel: string
}

export function SubmitButton({ isSubmitting, idleLabel, submittingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-65"
    >
      {isSubmitting && (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
      )}
      <span>{isSubmitting ? submittingLabel : idleLabel}</span>
    </button>
  )
}
