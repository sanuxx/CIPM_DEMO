import type { ReactNode } from 'react'
import { Logo } from '@/components/common'
import { DemoBadge } from '@/components/ui'

export function AuthLayout({ title, subtitle, children, wide }: { title: string; subtitle?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-navy-50 via-white to-sky-50 p-12 lg:flex">
        <Logo />
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-ink">Build a career in people management.</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
            Study the Certificate in Human Resource Management online: recorded lectures, study guides, knowledge checks and a certificate on completion.
          </p>
        </div>
        <DemoBadge className="w-fit" />
      </aside>
      <main className="flex items-center justify-center bg-white px-4 py-10 sm:px-8">
        <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  )
}
