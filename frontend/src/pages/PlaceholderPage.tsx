interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="page-title">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-600">SkillSwap workspace</p>
        <h1 id="page-title" className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
      </div>

      <div className="mt-8 grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-teal-200 bg-white/70 px-6 py-12 text-center shadow-sm">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-2xl" aria-hidden="true">✦</span>
          <h2 className="mt-5 text-xl font-extrabold text-ink">Coming in the next step</h2>
          <p className="mt-2 leading-7 text-slate-500">This route is ready for its real API-backed experience. No placeholder data has been added.</p>
        </div>
      </div>
    </section>
  )
}
