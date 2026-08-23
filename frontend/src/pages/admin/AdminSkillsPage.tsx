import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createAdminSkill, disableAdminSkill, updateAdminSkill } from '../../api/admin'
import { normalizeApiError } from '../../api/errors'
import type { AdminSkill } from '../../api/types'

const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100'

export function AdminSkillsPage() {
  const [knownSkills, setKnownSkills] = useState<AdminSkill[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [editingSkill, setEditingSkill] = useState<AdminSkill | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const creatingRef = useRef(false)

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creatingRef.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const category = String(data.get('category') ?? '').trim()
    if (!name || !category) { setError('Skill name and category are required.'); return }
    creatingRef.current = true; setIsCreating(true); setError(null); setNotice(null)
    try { const skill = await createAdminSkill({ name, category }); setKnownSkills((current) => [skill, ...current]); setNotice(`${skill.name} was created.`); form.reset() }
    catch (requestError) { setError(normalizeApiError(requestError).message) }
    finally { creatingRef.current = false; setIsCreating(false) }
  }

  async function handleDisable(skill: AdminSkill) {
    if (mutatingId || !window.confirm(`Disable ${skill.name}? It will no longer be active in the catalog.`)) return
    setMutatingId(skill.id); setError(null); setNotice(null)
    try { const result = await disableAdminSkill(skill.id); setKnownSkills((current) => current.map((item) => item.id === skill.id ? { ...item, status: result.status } : item)); setNotice(`${skill.name} was disabled.`) }
    catch (requestError) { setError(normalizeApiError(requestError).message) }
    finally { setMutatingId(null) }
  }

  async function handleEdit(input: { name: string; category: string }) {
    if (!editingSkill) return
    setMutatingId(editingSkill.id); setError(null); setNotice(null)
    try { const updated = await updateAdminSkill(editingSkill.id, input); setKnownSkills((current) => current.map((item) => item.id === updated.id ? updated : item)); setNotice(`${updated.name} was updated.`); setEditingSkill(null) }
    catch (requestError) { setError(normalizeApiError(requestError).message) }
    finally { setMutatingId(null) }
  }

  return <div className="space-y-6"><div><h2 className="text-2xl font-extrabold">Skills management</h2><p className="mt-2 text-slate-500">Create and maintain canonical skills using the current administrator operations.</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-extrabold">Current API limitation</p><p className="mt-1">There is no ADMIN endpoint for listing existing skills. To avoid using an endpoint outside this task’s contract, this table contains only real skills created during the current visit. They remain editable here until this page is left or refreshed.</p></div>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{notice}</p>}<form noValidate onSubmit={handleCreate} className="grid gap-4 rounded-[2rem] border border-white bg-white p-5 shadow-md shadow-teal-900/5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><div><label htmlFor="new-skill-name" className="mb-2 block text-sm font-bold">Skill name</label><input id="new-skill-name" name="name" required placeholder="Machine Learning" className={fieldClassName} /></div><div><label htmlFor="new-skill-category" className="mb-2 block text-sm font-bold">Category</label><input id="new-skill-category" name="category" required placeholder="Artificial Intelligence" className={fieldClassName} /></div><button type="submit" disabled={isCreating} className="min-h-12 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white disabled:opacity-50">{isCreating ? 'Creating…' : 'Create skill'}</button></form>{knownSkills.length === 0 ? <div className="grid min-h-56 place-items-center rounded-[2rem] border border-dashed border-teal-200 bg-white/70 p-8 text-center"><div><h3 className="text-xl font-extrabold">No skills created this visit</h3><p className="mt-2 text-slate-500">Create a canonical skill above to manage it here.</p></div></div> : <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-lg shadow-teal-900/6"><div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Skill</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{knownSkills.map((skill) => <tr key={skill.id}><td className="px-6 py-4 font-bold">{skill.name}</td><td className="px-6 py-4 text-slate-600">{skill.category}</td><td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${skill.status === 'ACTIVE' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>{skill.status}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" disabled={mutatingId !== null || skill.status !== 'ACTIVE'} onClick={() => setEditingSkill(skill)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40">Edit</button><button type="button" disabled={mutatingId !== null || skill.status !== 'ACTIVE'} onClick={() => void handleDisable(skill)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-40">{mutatingId === skill.id ? 'Disabling…' : 'Disable'}</button></div></td></tr>)}</tbody></table></div></div>}{editingSkill && <EditSkillDialog skill={editingSkill} isSaving={mutatingId === editingSkill.id} onClose={() => setEditingSkill(null)} onSave={handleEdit} />}</div>
}

function EditSkillDialog({ skill, isSaving, onClose, onSave }: { skill: AdminSkill; isSaving: boolean; onClose: () => void; onSave: (input: { name: string; category: string }) => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name') ?? '').trim(); const category = String(data.get('category') ?? '').trim(); if (!name || !category) { setValidationError('Skill name and category are required.'); return } void onSave({ name, category }) }
  return <dialog ref={dialogRef} aria-labelledby="edit-admin-skill-title" onCancel={onClose} className="m-auto w-[min(94vw,34rem)] rounded-[2rem] border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/55"><header className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><h3 id="edit-admin-skill-title" className="text-xl font-extrabold">Edit skill</h3><button type="button" onClick={onClose} aria-label="Close edit form" className="grid size-10 place-items-center rounded-xl bg-slate-50 text-xl">×</button></header><form noValidate onSubmit={submit} className="space-y-5 p-6">{validationError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{validationError}</p>}<div><label htmlFor="edit-admin-skill" className="mb-2 block text-sm font-bold">Skill name</label><input id="edit-admin-skill" name="name" defaultValue={skill.name} className={fieldClassName} /></div><div><label htmlFor="edit-admin-category" className="mb-2 block text-sm font-bold">Category</label><input id="edit-admin-category" name="category" defaultValue={skill.category} className={fieldClassName} /></div><button type="submit" disabled={isSaving} className="min-h-12 w-full rounded-xl bg-teal-600 px-5 py-3 font-bold text-white disabled:opacity-50">{isSaving ? 'Saving…' : 'Save changes'}</button></form></dialog>
}
