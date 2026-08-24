import { useEffect, useMemo, useRef, useState, type ComponentProps, type FormEvent } from 'react'
import { normalizeApiError } from '../api/errors'
import {
  addMySkill,
  getMyProfile,
  removeMySkill,
  updateMyProfile,
} from '../api/profile'
import { listSkills } from '../api/skills'
import type {
  MyProfile,
  Skill,
  SkillLevel,
  SkillType,
  UpdateProfileInput,
  UserSkill,
} from '../api/types'
import { FeedbackBanner } from '../components/FeedbackBanner'
import { ProfileIdentityCard } from '../components/ProfileIdentityCard'

const inputClassName = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500'

export function ProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [catalog, setCatalog] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function loadProfile() {
    const nextProfile = await getMyProfile()
    setProfile(nextProfile)
    return nextProfile
  }

  async function loadCatalog() {
    const skills = await listSkills()
    setCatalog(skills)
    return skills
  }

  useEffect(() => {
    let cancelled = false

    void Promise.allSettled([getMyProfile(), listSkills()]).then(([profileResult, catalogResult]) => {
      if (cancelled) return

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value)
      } else {
        setProfileError(normalizeApiError(profileResult.reason).message)
      }

      if (catalogResult.status === 'fulfilled') {
        setCatalog(catalogResult.value)
      } else {
        setCatalogError(normalizeApiError(catalogResult.reason).message)
      }

      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function retryProfile() {
    setIsLoading(true)
    setProfileError(null)
    try {
      await loadProfile()
    } catch (error) {
      setProfileError(normalizeApiError(error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <ProfileLoading />

  if (!profile) {
    return (
      <ErrorPanel
        title="We couldn’t load your profile"
        message={profileError ?? 'An unexpected error occurred.'}
        onRetry={retryProfile}
      />
    )
  }

  return (
    <section aria-labelledby="profile-title" className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-600">Your SkillSwap identity</p>
          <h1 id="profile-title" className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Profile</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Keep your details and learning goals accurate so future matches understand how you can help each other.</p>
        </div>
      </header>

      {notice && <FeedbackBanner tone="success" message={notice} onDismiss={() => setNotice(null)} />}

      <ProfileOverview profile={profile} onUpdated={(message, updatedProfile) => {
        setProfile(updatedProfile)
        setNotice(message)
      }} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
        <SkillSection
          title="Skills I Can Help With"
          description="Knowledge you can share with another student."
          skills={profile.skills.filter((skill) => skill.type === 'OFFER')}
          tone="offer"
          onRemoved={async () => {
            await loadProfile()
            setNotice('Skill removed from your profile.')
          }}
        />
        <SkillSection
          title="Skills I Want Help With"
          description="Topics you’d like to learn from a peer."
          skills={profile.skills.filter((skill) => skill.type === 'WANT')}
          tone="want"
          onRemoved={async () => {
            await loadProfile()
            setNotice('Skill removed from your profile.')
          }}
        />
        <AddSkillCard
          catalog={catalog}
          catalogError={catalogError}
          existingSkills={profile.skills}
          onRetryCatalog={async () => {
            setCatalogError(null)
            try {
              await loadCatalog()
            } catch (error) {
              setCatalogError(normalizeApiError(error).message)
            }
          }}
          onAdded={async () => {
            await loadProfile()
            setNotice('Skill added to your profile.')
          }}
        />
      </div>
    </section>
  )
}

function ProfileOverview({ profile, onUpdated }: { profile: MyProfile; onUpdated: (message: string, profile: MyProfile) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return

    const formData = new FormData(event.currentTarget)
    const academicYearValue = String(formData.get('academicYear') ?? '').trim()
    if (academicYearValue && !Number.isInteger(Number(academicYearValue))) {
      setError('Academic year must be a whole number.')
      return
    }

    const input: UpdateProfileInput = {
      firstName: String(formData.get('firstName') ?? '').trim(),
      lastName: String(formData.get('lastName') ?? '').trim(),
      bio: String(formData.get('bio') ?? '').trim(),
      department: String(formData.get('department') ?? '').trim(),
      ...(academicYearValue ? { academicYear: Number(academicYearValue) } : {}),
    }

    savingRef.current = true
    setIsSaving(true)
    setError(null)
    try {
      const updatedProfile = await updateMyProfile(input)
      onUpdated('Profile details saved.', updatedProfile)
      setIsEditing(false)
    } catch (requestError) {
      setError(normalizeApiError(requestError).message)
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <ProfileIdentityCard
      firstName={profile.firstName}
      lastName={profile.lastName}
      avatarUrl={profile.avatarUrl}
      secondaryText={profile.department || 'Department not added'}
      action={<button type="button" onClick={() => { setError(null); setIsEditing((value) => !value) }} className="rounded-xl border border-teal-200 px-5 py-2.5 text-sm font-bold text-teal-700 outline-none transition hover:bg-teal-50 focus-visible:ring-4 focus-visible:ring-teal-100">
            {isEditing ? 'Cancel editing' : 'Edit profile'}
          </button>}
    >

        {isEditing ? (
          <form onSubmit={handleSubmit} className="mt-8 border-t border-slate-100 pt-7">
            {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
            <div className="grid gap-5 sm:grid-cols-2">
              <EditField name="firstName" label="First name" defaultValue={profile.firstName} required />
              <EditField name="lastName" label="Last name" defaultValue={profile.lastName} required />
              <EditField name="department" label="Department" defaultValue={profile.department} />
              <EditField name="academicYear" label="Academic year" type="number" step="1" defaultValue={profile.academicYear} />
              <div className="sm:col-span-2">
                <label htmlFor="edit-bio" className="mb-2 block text-sm font-bold">Bio</label>
                <textarea id="edit-bio" name="bio" rows={4} defaultValue={profile.bio} className={inputClassName} />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={isSaving} onClick={() => setIsEditing(false)} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">Cancel</button>
              <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving && <Spinner />} {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 grid gap-6 border-t border-slate-100 pt-7 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">About</h3>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{profile.bio || 'No bio added yet.'}</p>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <ProfileFact label="Academic year" value={String(profile.academicYear)} />
              <ProfileFact label="Rating" value={profile.totalReviews > 0 ? `★ ${profile.averageRating}` : 'No ratings'} />
              <ProfileFact label="Institution" value={profile.institution.name} />
              <ProfileFact label="Unit" value={profile.unit?.name ?? 'Not assigned'} />
              <ProfileFact label="Reviews" value={String(profile.totalReviews)} />
              <ProfileFact label="Department" value={profile.department || 'Not added'} />
            </dl>
          </div>
        )}
    </ProfileIdentityCard>
  )
}

function SkillSection({ title, description, skills, tone, onRemoved }: { title: string; description: string; skills: UserSkill[]; tone: 'offer' | 'want'; onRemoved: () => Promise<void> }) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove(skill: UserSkill) {
    if (!window.confirm(`Remove ${skill.name} from ${title.toLowerCase()}?`)) return
    setRemovingId(skill.id)
    setError(null)
    try {
      await removeMySkill(skill.id)
      await onRemoved()
    } catch (requestError) {
      setError(normalizeApiError(requestError).message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <article className="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-teal-900/6 sm:p-6">
      <div className={`mb-5 grid size-11 place-items-center rounded-2xl text-xl ${tone === 'offer' ? 'bg-teal-100 text-teal-700' : 'bg-coral-100 text-coral-500'}`} aria-hidden="true">{tone === 'offer' ? '↗' : '↙'}</div>
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{description}</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{error}</p>}

      {skills.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm leading-6 text-slate-500">No skills in this section yet. Use the form alongside to add one.</div>
      ) : (
        <ul className="mt-5 space-y-3">
          {skills.map((skill) => (
            <li key={skill.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{skill.name}</p>
                <p className="mt-0.5 text-xs font-semibold capitalize text-slate-500">{skill.level.toLowerCase()}</p>
              </div>
              <button type="button" disabled={removingId !== null} onClick={() => void handleRemove(skill)} className="shrink-0 rounded-lg px-2.5 py-2 text-sm font-bold text-coral-500 hover:bg-coral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Remove ${skill.name}`}>
                {removingId === skill.id ? <Spinner /> : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function AddSkillCard({ catalog, catalogError, existingSkills, onRetryCatalog, onAdded }: { catalog: Skill[]; catalogError: string | null; existingSkills: UserSkill[]; onRetryCatalog: () => Promise<void>; onAdded: () => Promise<void> }) {
  const [type, setType] = useState<SkillType>('OFFER')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addingRef = useRef(false)
  const availableSkills = useMemo(() => catalog.filter((skill) => !existingSkills.some((existing) => existing.skillId === skill.id && existing.type === type)), [catalog, existingSkills, type])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (addingRef.current) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const skillId = String(formData.get('skillId') ?? '')
    const level = String(formData.get('level') ?? '') as SkillLevel
    if (!skillId) {
      setError('Choose a skill from the catalog.')
      return
    }

    addingRef.current = true
    setIsAdding(true)
    setError(null)
    try {
      await addMySkill({ skillId, type, level })
      await onAdded()
      form.reset()
    } catch (requestError) {
      setError(normalizeApiError(requestError).message)
    } finally {
      addingRef.current = false
      setIsAdding(false)
    }
  }

  return (
    <article id="add-skill" className="scroll-mt-24 rounded-[2rem] border border-teal-100 bg-teal-50/70 p-5 shadow-lg shadow-teal-900/5 sm:p-6 xl:row-span-1">
      <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-white text-2xl font-medium text-teal-700 shadow-sm" aria-hidden="true">+</div>
      <h2 className="text-xl font-extrabold tracking-tight">Add a skill</h2>
      <p className="mt-1 text-sm leading-5 text-slate-500">Choose from your institution’s canonical skill catalog.</p>

      {catalogError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-white p-4">
          <p role="alert" className="text-sm font-medium text-red-800">{catalogError}</p>
          <button type="button" onClick={() => void onRetryCatalog()} className="mt-3 text-sm font-bold text-teal-700 underline underline-offset-4">Retry catalog</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{error}</p>}
          <div>
            <label htmlFor="skill-type" className="mb-2 block text-sm font-bold">I want to</label>
            <select id="skill-type" name="type" value={type} onChange={(event) => setType(event.target.value as SkillType)} className={inputClassName}>
              <option value="OFFER">Offer help</option>
              <option value="WANT">Get help</option>
            </select>
          </div>
          <div>
            <label htmlFor="canonical-skill" className="mb-2 block text-sm font-bold">Skill</label>
            <select key={type} id="canonical-skill" name="skillId" required defaultValue="" className={inputClassName} disabled={availableSkills.length === 0}>
              <option value="" disabled>{availableSkills.length === 0 ? 'No skills available' : 'Choose a skill'}</option>
              {availableSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name} · {skill.category}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="skill-level" className="mb-2 block text-sm font-bold">Level</label>
            <select id="skill-level" name="level" defaultValue="BEGINNER" className={inputClassName}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <button type="submit" disabled={isAdding || availableSkills.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60">
            {isAdding && <Spinner />} {isAdding ? 'Adding…' : 'Add skill'}
          </button>
        </form>
      )}
    </article>
  )
}

function EditField({ name, label, ...props }: { name: string; label: string } & ComponentProps<'input'>) {
  const id = `edit-${name}`
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold">{label}</label><input id={id} name={name} className={inputClassName} {...props} /></div>
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-ink">{value}</dd></div>
}

function ProfileLoading() {
  return <div role="status" aria-label="Loading profile" className="animate-pulse space-y-8"><div className="h-20 max-w-xl rounded-2xl bg-teal-100" /><div className="h-80 rounded-[2rem] bg-white" /><div className="grid gap-6 md:grid-cols-3"><div className="h-72 rounded-[2rem] bg-white" /><div className="h-72 rounded-[2rem] bg-white" /><div className="h-72 rounded-[2rem] bg-teal-50" /></div></div>
}

function ErrorPanel({ title, message, onRetry }: { title: string; message: string; onRetry: () => Promise<void> }) {
  return <section className="grid min-h-96 place-items-center rounded-[2rem] border border-red-100 bg-white p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl text-red-700" aria-hidden="true">!</span><h1 className="mt-5 text-2xl font-extrabold">{title}</h1><p role="alert" className="mt-2 text-slate-600">{message}</p><button type="button" onClick={() => void onRetry()} className="mt-6 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200">Try again</button></div></section>
}

function Spinner() {
  return <span aria-hidden="true" className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
}
