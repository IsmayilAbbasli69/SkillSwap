import type { PropsWithChildren, ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps extends PropsWithChildren {
  eyebrow: string
  title: string
  description: string
  footer: ReactNode
  wide?: boolean
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  footer,
  wide = false,
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-cream px-4 py-8 sm:px-6 lg:flex lg:items-center lg:px-10 lg:py-12">
      <div aria-hidden="true" className="absolute -left-28 -top-28 size-72 rounded-full bg-teal-100/70 blur-2xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-20 size-80 rounded-full bg-coral-100/75 blur-2xl" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <section className="px-2 py-3 sm:px-6 lg:px-0" aria-labelledby="auth-intro-title">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-xl text-ink outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-teal-600 text-xl font-bold text-white shadow-lg shadow-teal-600/20" aria-hidden="true">
              S
            </span>
            <span className="text-xl font-extrabold tracking-tight">SkillSwap</span>
          </Link>

          <div className="mt-12 max-w-lg lg:mt-20">
            <p className="mb-4 inline-flex rounded-full bg-coral-100 px-4 py-1.5 text-sm font-bold text-coral-500">
              Learn together. Grow together.
            </p>
            <h1 id="auth-intro-title" className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Your next skill is closer than you think.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Meet students who can teach what you want to learn—and share what you already know.
            </p>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2"><CheckIcon /> Student-led learning</span>
            <span className="flex items-center gap-2"><CheckIcon /> Real skill exchanges</span>
          </div>
        </section>

        <section className={`rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-teal-900/10 backdrop-blur sm:p-10 ${wide ? 'lg:p-11' : 'lg:mx-auto lg:w-full lg:max-w-xl'}`}>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-600">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{title}</h2>
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">{footer}</div>
        </section>
      </div>
    </main>
  )
}

function CheckIcon() {
  return (
    <span className="grid size-5 place-items-center rounded-full bg-teal-100 text-xs font-black text-teal-700" aria-hidden="true">
      ✓
    </span>
  )
}
