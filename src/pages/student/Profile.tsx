import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Award, Camera, Trash2 } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { changePassword, updateUser } from '@/store/actions'
import { Avatar, Badge, Button, Card, CardHeader, DescriptionList, Field, Input } from '@/components/ui'
import { PaymentBadge } from '@/components/common'
import { changePasswordSchema, phoneRule } from '@/lib/schemas'
import { formatDate, formatLKR, formatLongDate, sleep } from '@/lib/utils'
import { fileToDataUrl } from '@/lib/files'

const infoSchema = z.object({ name: z.string().trim().min(3, 'Enter your full name'), email: z.string().min(1, 'Enter your email').email('Enter a valid email'), phone: phoneRule })

export default function Profile() {
  const { user, course, enrollment, intake, payments, certificate, stats } = useStudent()
  const fileRef = useRef<HTMLInputElement>(null)
  const info = useForm<z.infer<typeof infoSchema>>({ resolver: zodResolver(infoSchema), defaultValues: { name: user.name, email: user.email, phone: user.phone } })
  const pw = useForm<z.infer<typeof changePasswordSchema>>({ resolver: zodResolver(changePasswordSchema) })

  const onPhoto = async (f?: File) => {
    if (!f) return
    const res = await fileToDataUrl(f, { maxKb: 600, accept: /^image\// })
    if (!res.ok) return toast.error(res.error)
    updateUser(user.id, { photo: res.data })
    toast.success('Profile photo updated')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader title="Personal information" />
          <div className="flex flex-col gap-6 p-5 sm:flex-row">
            <div className="flex flex-col items-center gap-3">
              <Avatar name={user.name} photo={user.photo} size={96} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = '' }} />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Camera className="size-3.5" />Change</Button>
                {user.photo && <Button size="sm" variant="ghost" aria-label="Remove photo" onClick={() => { updateUser(user.id, { photo: undefined }); toast.success('Photo removed') }}><Trash2 className="size-3.5" /></Button>}
              </div>
            </div>
            <form noValidate className="grid flex-1 gap-4 sm:grid-cols-2" onSubmit={info.handleSubmit(async (v) => {
              await sleep(400)
              const res = updateUser(user.id, { name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() })
              if (!res.ok) return info.setError('email', { message: res.error })
              toast.success('Profile saved')
            })}>
              <Field label="Full name" className="sm:col-span-2" error={info.formState.errors.name?.message}><Input {...info.register('name')} /></Field>
              <Field label="Email" error={info.formState.errors.email?.message}><Input type="email" {...info.register('email')} /></Field>
              <Field label="Phone number" error={info.formState.errors.phone?.message}><Input {...info.register('phone')} /></Field>
              <div className="sm:col-span-2"><Button type="submit" loading={info.formState.isSubmitting}>Save changes</Button></div>
            </form>
          </div>
        </Card>

        <Card>
          <CardHeader title="Change password" />
          <form noValidate className="grid gap-4 p-5 sm:grid-cols-3" onSubmit={pw.handleSubmit(async (v) => {
            await sleep(400)
            const res = changePassword(user.id, v.current, v.next)
            if (!res.ok) return pw.setError('current', { message: res.error })
            toast.success('Password updated'); pw.reset()
          })}>
            <Field label="Current password" error={pw.formState.errors.current?.message}><Input type="password" autoComplete="current-password" {...pw.register('current')} /></Field>
            <Field label="New password" error={pw.formState.errors.next?.message}><Input type="password" autoComplete="new-password" {...pw.register('next')} /></Field>
            <Field label="Confirm new password" error={pw.formState.errors.confirm?.message}><Input type="password" autoComplete="new-password" {...pw.register('confirm')} /></Field>
            <div className="sm:col-span-3"><Button type="submit" variant="outline" loading={pw.formState.isSubmitting}>Update password</Button></div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Payment history" action={<Link to="/app/payments"><Button variant="ghost" size="sm">Details</Button></Link>} />
          <ul className="divide-y divide-line">
            {payments.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><span className="font-mono text-xs">{p.reference}</span><span className="text-muted">{formatDate(p.date)}</span><span>{formatLKR(p.amount)}</span><PaymentBadge status={p.status} /></li>)}
            {payments.length === 0 && <li className="px-5 py-6 text-sm text-muted">No payments yet.</li>}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Enrollment" />
          <div className="p-5">
            {enrollment && course ? (
              <DescriptionList items={[['Student ID', user.studentNo ?? '—'], ['Course', course.title], ['Intake', intake?.name ?? '—'], ['Enrolled', formatDate(enrollment.enrolledAt)], ['Access until', formatDate(enrollment.accessExpiresAt)], ['Status', <Badge key="s" tone={enrollment.status === 'active' ? 'green' : enrollment.status === 'completed' ? 'navy' : 'amber'}>{enrollment.status}</Badge>], ['Progress', `${stats?.percent ?? 0}%`]]} />
            ) : (
              <div className="space-y-3 text-sm text-muted"><p>You are not enrolled in a course yet.</p><Link to="/app/enroll"><Button>Enrol now</Button></Link></div>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Certificate" />
          <div className="p-5 text-sm">
            {certificate ? (
              <div className="space-y-3"><div className="flex items-center gap-2 font-medium"><Award className="size-5 text-accent-600" />{certificate.number}</div><p className="text-muted">Issued {formatLongDate(certificate.issuedAt)}</p><Link to="/app/certificates"><Button variant="outline" size="sm">View certificate</Button></Link></div>
            ) : <p className="text-muted">Your certificate is issued when all modules are completed.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
