import { useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from './AuthLayout'
import { Button, Field, Input } from '@/components/ui'
import { registerSchema } from '@/lib/schemas'
import { registerStudent } from '@/store/actions'
import { useAuth } from '@/store/hooks'
import { sleep } from '@/lib/utils'

type Values = z.infer<typeof registerSchema>

export default function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(registerSchema) })
  const registering = useRef(false)
  // Already signed in → go to the portal, except while this form is completing its own registration.
  if (user && !registering.current) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />

  const onSubmit = async (v: Values) => {
    await sleep(600)
    registering.current = true
    const res = registerStudent({ name: v.name.trim(), email: v.email, phone: v.phone.replace(/\s+/g, ' ').trim(), password: v.password })
    if (!res.ok) { registering.current = false; setError('email', { message: res.error }); return }
    toast.success('Account created', { description: 'Next, verify your email and choose your induction date.' })
    navigate('/verify-email', { replace: true })
  }

  return (
    <AuthLayout title="Create your student account" subtitle="Register, choose an induction date and pay the course fee to start learning." wide>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
          <Input id="name" autoComplete="name" placeholder="e.g. Nuwan Perera" aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="077 123 4567" aria-invalid={!!errors.phone} {...register('phone')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number">
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register('confirm')} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
          <p className="mt-4 text-center text-sm text-muted">Already registered? <Link to="/login" className="font-medium text-navy-700 hover:underline">Sign in</Link></p>
        </div>
      </form>
    </AuthLayout>
  )
}
