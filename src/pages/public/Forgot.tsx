import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CheckCircle2, MailCheck } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button, Card, Field, Input } from '@/components/ui'
import { passwordRule } from '@/lib/schemas'
import { resetPassword } from '@/store/actions'
import { sleep } from '@/lib/utils'

const emailSchema = z.object({ email: z.string().min(1, 'Enter your email').email('Enter a valid email address') })
const resetSchema = z.object({ password: passwordRule, confirm: z.string().min(1, 'Confirm the password') }).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export default function Forgot() {
  const [step, setStep] = useState<'email' | 'sent' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const f1 = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) })
  const f2 = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) })

  return (
    <AuthLayout title="Reset your password" subtitle={step === 'email' ? 'Enter your account email and we will send a reset link.' : undefined}>
      {step === 'email' && (
        <form noValidate className="space-y-4" onSubmit={f1.handleSubmit(async (v) => { await sleep(700); setEmail(v.email); setStep('sent') })}>
          <Field label="Email" htmlFor="email" error={f1.formState.errors.email?.message}>
            <Input id="email" type="email" aria-invalid={!!f1.formState.errors.email} {...f1.register('email')} />
          </Field>
          <Button type="submit" className="w-full" loading={f1.formState.isSubmitting}>Send reset link</Button>
        </form>
      )}
      {step === 'sent' && (
        <Card className="space-y-4 p-6 text-center">
          <MailCheck className="mx-auto size-10 text-navy-700" />
          <p className="text-sm text-slate-700">If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
          <p className="text-xs text-muted">Demo: no email is actually sent. Use the button below to open the simulated reset link.</p>
          <Button className="w-full" onClick={() => setStep('reset')}>Open reset link</Button>
        </Card>
      )}
      {step === 'reset' && (
        <form noValidate className="space-y-4" onSubmit={f2.handleSubmit(async (v) => {
          await sleep(500)
          const res = resetPassword(email, v.password)
          if (!res.ok) { toast.error(res.error); setStep('email'); return }
          setStep('done')
        })}>
          <p className="text-sm text-muted">Choose a new password for <strong>{email}</strong>.</p>
          <Field label="New password" htmlFor="password" error={f2.formState.errors.password?.message}><Input id="password" type="password" {...f2.register('password')} /></Field>
          <Field label="Confirm password" htmlFor="confirm" error={f2.formState.errors.confirm?.message}><Input id="confirm" type="password" {...f2.register('confirm')} /></Field>
          <Button type="submit" className="w-full" loading={f2.formState.isSubmitting}>Update password</Button>
        </form>
      )}
      {step === 'done' && (
        <Card className="space-y-4 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
          <p className="text-sm">Your password has been updated.</p>
          <Link to="/login"><Button className="w-full">Back to sign in</Button></Link>
        </Card>
      )}
      {step !== 'done' && <p className="mt-6 text-center text-sm"><Link to="/login" className="font-medium text-navy-700 hover:underline">Back to sign in</Link></p>}
    </AuthLayout>
  )
}
