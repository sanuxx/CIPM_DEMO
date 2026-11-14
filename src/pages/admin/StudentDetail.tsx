import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Award, Pencil, Power } from 'lucide-react'
import { useDB } from '@/store/db'
import { studentRow } from '@/lib/analytics'
import { getAttempts, getCourseModules, getModuleInfo } from '@/lib/progress'
import { Avatar, Badge, Button, Card, CardHeader, DescriptionList, EmptyState, Field, Input, Modal, ProgressBar, Tabs, useConfirm } from '@/components/ui'
import { AccountBadge, ModuleStatusBadge, PaymentBadge } from '@/components/common'
import { ReceiptModal } from '@/components/Receipt'
import { issueCertificateNow, updateUser } from '@/store/actions'
import { phoneRule } from '@/lib/schemas'
import { formatDate, formatDateTime, formatLKR, timeAgo } from '@/lib/utils'
import type { Payment } from '@/types'

const schema = z.object({ name: z.string().trim().min(3, 'Enter a full name'), email: z.string().min(1, 'Enter an email').email('Enter a valid email'), phone: phoneRule })

export default function AdminStudentDetail() {
  const { id } = useParams()
  const db = useDB()
  const [tab, setTab] = useState<'profile' | 'payments' | 'progress' | 'quizzes' | 'activity'>('profile')
  const [editing, setEditing] = useState(false)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const [confirm, dialog] = useConfirm()
  const user = db.users.find((u) => u.id === id && u.role === 'student')
  if (!user) return <Card><EmptyState title="Student not found" action={<Link to="/admin/students"><Button>Back to students</Button></Link>} /></Card>

  const r = studentRow(db, user)
  const payments = db.payments.filter((p) => p.userId === user.id).sort((a, b) => b.date.localeCompare(a.date))
  const modules = r.course ? getCourseModules(db, r.course.id).map((m) => getModuleInfo(db, user.id, m)) : []
  const attempts = db.attempts.filter((a) => a.userId === user.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const acts = db.activities.filter((a) => a.userId === user.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40)
  const cert = db.certificates.find((c) => c.userId === user.id)

  return (
    <>
      <Link to="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />All students</Link>
      <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar name={user.name} photo={user.photo} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{user.name}</h1><AccountBadge status={user.status} /></div>
          <p className="text-sm text-muted">{user.studentNo} · {user.email} · {user.phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" />Edit</Button>
          <Button variant={user.status === 'active' ? 'outline' : 'primary'} onClick={() => confirm({
            title: user.status === 'active' ? 'Deactivate account?' : 'Activate account?', danger: user.status === 'active', confirmLabel: user.status === 'active' ? 'Deactivate' : 'Activate',
            description: user.status === 'active' ? `${user.name} will no longer be able to sign in.` : `${user.name} will be able to sign in again.`,
            onConfirm: () => { updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' }); toast.success(user.status === 'active' ? 'Account deactivated' : 'Account activated') },
          })}><Power className="size-4" />{user.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
        </div>
      </Card>

      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ id: 'profile', label: 'Profile & enrollment' }, { id: 'payments', label: 'Payments', count: payments.length }, { id: 'progress', label: 'Progress' }, { id: 'quizzes', label: 'Quiz attempts', count: attempts.length }, { id: 'activity', label: 'Activity' }]} />

      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader title="Profile" /><div className="p-5"><DescriptionList items={[['Student ID', user.studentNo ?? '—'], ['Full name', user.name], ['Email', user.email], ['Phone', user.phone], ['Email verified', user.emailVerified ? 'Yes' : 'No'], ['Registered', formatDate(user.createdAt)], ['Last sign-in', user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'Never']]} /></div></Card>
          <Card><CardHeader title="Enrollment" /><div className="p-5">
            {r.enrollment ? <DescriptionList items={[['Course', r.course?.title ?? '—'], ['Intake', r.intake?.name ?? '—'], ['Status', <Badge key="s" tone={r.enrollment.status === 'active' ? 'green' : r.enrollment.status === 'completed' ? 'navy' : 'amber'}>{r.enrollment.status}</Badge>], ['Enrolled', formatDate(r.enrollment.enrolledAt)], ['Access until', formatDate(r.enrollment.accessExpiresAt)], ['Progress', `${r.stats?.percent ?? 0}%`], ['Certificate', cert ? cert.number : 'Not issued']]} /> : <p className="text-sm text-muted">Not enrolled. Manage enrollments under Enrollments.</p>}
            {r.stats?.complete && !cert && r.course && <Button className="mt-4" variant="outline" onClick={() => { issueCertificateNow(user.id, r.course!.id); toast.success('Certificate issued') }}><Award className="size-4" />Issue certificate</Button>}
          </div></Card>
        </div>
      )}

      {tab === 'payments' && (
        <Card>{payments.length === 0 ? <EmptyState title="No payment records" /> : <ul className="divide-y divide-line">{payments.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
            <span className="font-mono text-xs">{p.reference}</span><span className="text-muted">{formatDateTime(p.date)}</span><span className="ml-auto">{formatLKR(p.amount)}</span><PaymentBadge status={p.status} />
            <Button size="sm" variant="outline" onClick={() => setReceipt(p)}>Receipt</Button>
          </li>))}</ul>}</Card>
      )}

      {tab === 'progress' && (
        <Card>
          <CardHeader title="Module progress" description={r.stats ? `${r.stats.modulesDone} of ${r.stats.modulesTotal} modules completed · ${r.stats.lessonsDone}/${r.stats.lessonsTotal} lessons` : undefined} />
          {modules.length === 0 ? <EmptyState title="No progress yet" description="This student is not enrolled in a course." /> : <ul className="divide-y divide-line">{modules.map((m) => (
            <li key={m.module.id} className="flex items-center gap-4 px-5 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{m.module.order}. {m.module.title}</p><ProgressBar value={m.percent} className="mt-1.5" tone={m.complete ? 'green' : 'navy'} /></div><span className="text-xs text-muted">{m.done}/{m.total}</span><ModuleStatusBadge status={m.status} /></li>))}</ul>}
        </Card>
      )}

      {tab === 'quizzes' && (
        <Card>{attempts.length === 0 ? <EmptyState title="No quiz attempts" /> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-line text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Quiz</th><th className="px-5 py-3">Attempt</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Submitted</th></tr></thead>
            <tbody className="divide-y divide-line">{attempts.map((a) => {
              const quiz = db.quizzes.find((q) => q.id === a.quizId)
              const n = getAttempts(db, user.id, a.quizId).findIndex((x) => x.id === a.id) + 1
              return <tr key={a.id}><td className="px-5 py-3 font-medium">{quiz?.title ?? 'Deleted quiz'}</td><td className="px-5 py-3">#{n}</td><td className="px-5 py-3">{a.score}/{a.total} <Badge tone={a.percent >= 70 ? 'green' : a.percent >= 40 ? 'amber' : 'red'}>{a.percent}%</Badge></td><td className="px-5 py-3 text-muted">{formatDateTime(a.submittedAt)}</td></tr>
            })}</tbody></table></div>)}</Card>
      )}

      {tab === 'activity' && (
        <Card>{acts.length === 0 ? <EmptyState title="No activity" /> : <ul className="divide-y divide-line">{acts.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><span>{a.text}</span><span className="shrink-0 text-xs text-muted">{formatDateTime(a.at)}</span></li>)}</ul>}</Card>
      )}

      <Modal open={editing} onOpenChange={setEditing} title="Edit student" footer={<><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" form="student-form">Save changes</Button></>}>
        {editing && <EditForm user={user} onDone={() => setEditing(false)} />}
      </Modal>
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
      {dialog}
    </>
  )
}

function EditForm({ user, onDone }: { user: { id: string; name: string; email: string; phone: string }; onDone: () => void }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: user.name, email: user.email, phone: user.phone } })
  return (
    <form id="student-form" noValidate className="space-y-4" onSubmit={handleSubmit((v) => {
      const res = updateUser(user.id, { name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() })
      if (!res.ok) return setError('email', { message: res.error })
      toast.success('Student updated'); onDone()
    })}>
      <Field label="Full name" error={errors.name?.message}><Input {...register('name')} /></Field>
      <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></Field>
      <Field label="Phone" error={errors.phone?.message}><Input {...register('phone')} /></Field>
    </form>
  )
}
