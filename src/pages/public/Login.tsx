import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Award, GraduationCap, ShieldCheck, UserPlus, UserRound } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button, Card, Field, Input } from '@/components/ui'
import { login } from '@/store/actions'
import { useAuth } from '@/store/hooks'
import { DEMO_ACCOUNTS } from '@/data/seed'

const schema = z.object({ email: z.string().min(1, 'Enter your email').email('Enter a valid email address'), password: z.string().min(1, 'Enter your password') })
type Values = z.infer<typeof schema>

const SCENARIOS = [
  { key: 'fresh', icon: UserPlus, title: 'New student', desc: 'Not enrolled — try enrollment and payment', role: 'student' },
  { key: 'active', icon: UserRound, title: 'Active student', desc: 'Part-way through the course', role: 'student' },
  { key: 'completed', icon: Award, title: 'Completed student', desc: 'All 8 modules done — certificate ready', role: 'student' },
  { key: 'admin', icon: ShieldCheck, title: 'Administrator', desc: 'Full admin portal access', role: 'admin' },
] as const

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />

  const go = async (email: string, password: string, key?: string) => {
    setError('')
    setBusy(key ?? 'form')
    await new Promise((r) => setTimeout(r, 450))
    const res = login(email, password)
    setBusy(null)
    if (!res.ok) { setError(res.error); return }
    toast.success(`Welcome back, ${res.data.name.split(' ')[0]}`)
    const from = (loc.state as { from?: string } | null)?.from
    navigate(from && from.startsWith(res.data.role === 'admin' ? '/admin' : '/app') ? from : res.data.role === 'admin' ? '/admin' : '/app', { replace: true })
  }

  return (
    <AuthLayout title="Sign in" subtitle="Access the student or administration portal.">
      <form onSubmit={handleSubmit((v) => go(v.email, v.password))} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
        </Field>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-navy-700 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting || busy === 'form'}>Sign in</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New to eArrow? <Link to="/register" className="font-medium text-navy-700 hover:underline">Create a student account</Link>
      </p>

      <Card className="mt-8 border-dashed p-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-4 text-navy-700" />
          <h2 className="text-sm font-semibold">Demo accounts</h2>
        </div>
        <p className="mt-1 text-xs text-muted">One click signs you in with a pre-configured demo account (password shown for reference).</p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {SCENARIOS.map((s) => {
            const acc = DEMO_ACCOUNTS[s.key]
            return (
              <button
                key={s.key} disabled={!!busy} onClick={() => go(acc.email, acc.password, s.key)}
                className="flex items-start gap-3 rounded-xl border border-line bg-white p-3 text-left transition hover:border-navy-300 hover:bg-navy-50/40 disabled:opacity-60"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><s.icon className="size-4" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{busy === s.key ? 'Signing in…' : s.title}</span>
                  <span className="block text-xs text-muted">{s.desc}</span>
                  <span className="mt-1 block truncate text-[11px] text-slate-400">{acc.email} · {acc.password}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Card>
    </AuthLayout>
  )
}
