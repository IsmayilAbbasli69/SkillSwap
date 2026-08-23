import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import { scheduleSession } from '../api/requests'
import type { MeetingType, Session, SwapRequest } from '../api/types'
import { formatDateTime, localDateTimeToIso } from '../utils/date-time'

interface ScheduleSessionDialogProps {
  request: SwapRequest
  onClose: () => void
}

interface FormErrors {
  scheduledAt?: string
  duration?: string
  meetingUrl?: string
}

const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100'

export function ScheduleSessionDialog({ request, onClose }: ScheduleSessionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const submittingRef = useRef(false)
  const [meetingType, setMeetingType] = useState<MeetingType>('ONLINE')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  if (request.status !== 'ACCEPTED') return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const formData = new FormData(event.currentTarget)
    const scheduledAtValue = String(formData.get('scheduledAt') ?? '')
    const scheduledAt = localDateTimeToIso(scheduledAtValue)
    const duration = Number(formData.get('duration'))
    const meetingUrl = String(formData.get('meetingUrl') ?? '').trim()
    const locationNote = String(formData.get('locationNote') ?? '').trim()
    const nextErrors: FormErrors = {}

    if (!scheduledAt) nextErrors.scheduledAt = 'Choose a valid local date and time.'
    if (!Number.isInteger(duration) || duration < 15 || duration > 180) {
      nextErrors.duration = 'Duration must be a whole number between 15 and 180 minutes.'
    }
    if (meetingType === 'ONLINE' && meetingUrl && !isHttpUrl(meetingUrl)) {
      nextErrors.meetingUrl = 'Enter a valid URL beginning with http:// or https://.'
    }

    setErrors(nextErrors)
    setRequestError(null)
    if (!scheduledAt || Object.keys(nextErrors).length > 0) return

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const createdSession = await scheduleSession(request.id, {
        scheduledAt,
        duration,
        meetingType,
        ...(meetingType === 'ONLINE' && meetingUrl ? { meetingUrl } : {}),
        ...(locationNote ? { locationNote } : {}),
      })
      setSession(createdSession)
    } catch (error) {
      setRequestError(normalizeApiError(error).message)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="schedule-session-title" onCancel={onClose} className="m-auto max-h-[92dvh] w-[min(94vw,40rem)] overflow-y-auto rounded-[2rem] border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/55 backdrop:backdrop-blur-sm">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-teal-600">Accepted SkillSwap</p><h2 id="schedule-session-title" title={`Schedule with ${request.peer.name}`} className="mt-1 truncate text-xl font-extrabold">Schedule with {request.peer.name}</h2></div>
        <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200" aria-label="Close scheduling form">×</button>
      </header>

      {session ? (
        <div className="p-6 text-center sm:p-8">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-100 text-3xl text-teal-700" aria-hidden="true">✓</span>
          <h3 className="mt-5 text-2xl font-extrabold">Session scheduled</h3>
          <p role="status" className="mt-2 leading-7 text-slate-600">Your {session.duration}-minute {session.meetingType === 'ONLINE' ? 'online' : 'in-person'} session has been created.</p>
          <p className="mt-3 font-bold text-ink">{formatDateTime(session.scheduledAt)}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50">Stay on Requests</button><Link to="/sessions" className="rounded-xl bg-teal-600 px-5 py-3 font-bold text-white shadow-md shadow-teal-600/20">View Sessions</Link></div>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
          {requestError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{requestError}</p>}

          <fieldset>
            <legend className="mb-3 text-sm font-bold">Meeting type</legend>
            <div className="grid grid-cols-2 gap-3">
              <MeetingTypeOption value="ONLINE" current={meetingType} label="Online" description="Use your own meeting link" onChange={setMeetingType} />
              <MeetingTypeOption value="IN_PERSON" current={meetingType} label="In person" description="Meet at an agreed location" onChange={setMeetingType} />
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label htmlFor="session-datetime" className="mb-2 flex items-baseline justify-between gap-3 text-sm font-bold"><span>Date and local time</span><span className="text-xs text-teal-700">Required</span></label><input id="session-datetime" name="scheduledAt" type="datetime-local" required aria-invalid={Boolean(errors.scheduledAt)} aria-describedby={errors.scheduledAt ? 'session-datetime-error' : 'session-time-help'} className={fieldClassName} /><p id="session-time-help" className="mt-2 text-xs leading-5 text-slate-500">Enter the time in your current local timezone. It will be converted to an exact ISO timestamp before sending.</p>{errors.scheduledAt && <p id="session-datetime-error" role="alert" className="mt-2 text-sm font-medium text-red-700">{errors.scheduledAt}</p>}</div>
            <div><label htmlFor="session-duration" className="mb-2 flex items-baseline justify-between gap-3 text-sm font-bold"><span>Duration</span><span className="text-xs text-teal-700">Required</span></label><div className="relative"><input id="session-duration" name="duration" type="number" min="15" max="180" step="1" defaultValue="60" required aria-invalid={Boolean(errors.duration)} aria-describedby={errors.duration ? 'session-duration-error' : undefined} className={`${fieldClassName} pr-20`} /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-400">minutes</span></div>{errors.duration && <p id="session-duration-error" role="alert" className="mt-2 text-sm font-medium text-red-700">{errors.duration}</p>}</div>
          </div>

          {meetingType === 'ONLINE' && <div><label htmlFor="meeting-url" className="mb-2 flex items-baseline justify-between gap-3 text-sm font-bold"><span>Meeting URL</span><span className="text-xs font-medium text-slate-400">Optional</span></label><input id="meeting-url" name="meetingUrl" type="url" inputMode="url" placeholder="https://meet.google.com/…" aria-invalid={Boolean(errors.meetingUrl)} aria-describedby={errors.meetingUrl ? 'meeting-url-error' : 'meeting-url-help'} className={fieldClassName} /><p id="meeting-url-help" className="mt-2 text-xs leading-5 text-slate-500">Paste a link you created yourself. SkillSwap does not create a meeting or calendar event.</p>{errors.meetingUrl && <p id="meeting-url-error" role="alert" className="mt-2 text-sm font-medium text-red-700">{errors.meetingUrl}</p>}</div>}

          <div><label htmlFor="location-note" className="mb-2 flex items-baseline justify-between gap-3 text-sm font-bold"><span>{meetingType === 'ONLINE' ? 'Note' : 'Location note'}</span><span className="text-xs font-medium text-slate-400">Optional</span></label><textarea id="location-note" name="locationNote" rows={4} placeholder={meetingType === 'ONLINE' ? 'Anything your peer should know before joining' : 'Campus building, room, or meeting point'} className={fieldClassName} /></div>

          <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3 font-bold text-white shadow-lg shadow-coral-500/20 hover:bg-coral-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral-100 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{isSubmitting ? 'Scheduling…' : 'Schedule Session'}</button>
        </form>
      )}
    </dialog>
  )
}

function MeetingTypeOption({ value, current, label, description, onChange }: { value: MeetingType; current: MeetingType; label: string; description: string; onChange: (value: MeetingType) => void }) {
  const selected = current === value
  return <label className={`cursor-pointer rounded-2xl border p-4 transition has-focus-visible:ring-4 has-focus-visible:ring-teal-100 ${selected ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-200'}`}><input type="radio" name="meetingType" value={value} checked={selected} onChange={() => onChange(value)} className="sr-only" /><span className="block font-extrabold">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></label>
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
