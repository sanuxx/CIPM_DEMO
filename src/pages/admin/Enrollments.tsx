import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { useDB } from '@/store/db'
import { updateEnrollment } from '@/store/actions'
import { getCourseStats } from '@/lib/progress'
import { Badge, Button, DataTable, Field, Modal, PageHeader, ProgressBar, Select, Input } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { Enrollment, EnrollmentStatus } from '@/types'

const TONE: Record<EnrollmentStatus, 'green' | 'navy' | 'amber' | 'slate'> = { active: 'green', completed: 'navy', suspended: 'amber', cancelled: 'slate' }

export default function AdminEnrollments() {
  const db = useDB()
  const [status, setStatus] = useState<'all' | EnrollmentStatus>('all')
  const [editing, setEditing] = useState<Enrollment | null>(null)
  const rows = db.enrollments.filter((e) => status === 'all' || e.status === status)

  return (
    <>
      <PageHeader title="Enrollments" description="Change a student's intake, status or access period." />
      <DataTable
        rows={rows} rowKey={(e) => e.id} pageSize={10} initialSort={{ key: 'date', dir: 'desc' }}
        search={(e) => `${db.users.find((u) => u.id === e.userId)?.name} ${db.users.find((u) => u.id === e.userId)?.email}`} searchPlaceholder="Search student…"
        filters={<Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status" className="w-40"><option value="all">All statuses</option><option value="active">Active</option><option value="completed">Completed</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option></Select>}
        columns={[
          { key: 'student', header: 'Student', render: (e) => { const u = db.users.find((x) => x.id === e.userId); return u ? <Link to={`/admin/students/${u.id}`} className="font-medium hover:underline">{u.name}</Link> : '—' }, sort: (e) => db.users.find((x) => x.id === e.userId)?.name ?? '' },
          { key: 'course', header: 'Course', render: (e) => db.courses.find((c) => c.id === e.courseId)?.code ?? '—' },
          { key: 'intake', header: 'Intake', render: (e) => formatDate(db.intakes.find((i) => i.id === e.intakeId)?.date), sort: (e) => db.intakes.find((i) => i.id === e.intakeId)?.date ?? '' },
          { key: 'status', header: 'Status', render: (e) => <Badge tone={TONE[e.status]} className="capitalize">{e.status}</Badge>, sort: (e) => e.status },
          { key: 'prog', header: 'Progress', render: (e) => { const p = getCourseStats(db, e.userId, e.courseId).percent; return <div className="flex w-28 items-center gap-2"><ProgressBar value={p} /><span className="w-8 text-xs text-muted">{p}%</span></div> }, sort: (e) => getCourseStats(db, e.userId, e.courseId).percent },
          { key: 'date', header: 'Enrolled', render: (e) => formatDate(e.enrolledAt), sort: (e) => e.enrolledAt },
          { key: 'exp', header: 'Access until', render: (e) => formatDate(e.accessExpiresAt), sort: (e) => e.accessExpiresAt },
          { key: 'act', header: '', render: (e) => <Button size="sm" variant="outline" onClick={() => setEditing(e)}><Pencil className="size-3.5" />Change</Button> },
        ]}
      />
      {editing && <EnrollForm key={editing.id} enrollment={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function EnrollForm({ enrollment, onClose }: { enrollment: Enrollment; onClose: () => void }) {
  const db = useDB()
  const user = db.users.find((u) => u.id === enrollment.userId)
  const [intakeId, setIntakeId] = useState(enrollment.intakeId)
  const [status, setStatus] = useState(enrollment.status)
  const [expires, setExpires] = useState(enrollment.accessExpiresAt.slice(0, 10))
  const intakes = [...db.intakes].filter((i) => i.courseId === enrollment.courseId).sort((a, b) => a.date.localeCompare(b.date))
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Change enrollment" description={user?.name}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => {
        if (!expires) return toast.error('Choose an access expiry date.')
        updateEnrollment(enrollment.id, { intakeId, status, accessExpiresAt: new Date(expires).toISOString() })
        toast.success('Enrollment updated', { description: 'The student portal reflects this change immediately.' }); onClose()
      }}>Save changes</Button></>}>
      <div className="space-y-4">
        <Field label="Intake"><Select value={intakeId} onChange={(e) => setIntakeId(e.target.value)}>{intakes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field>
        <Field label="Status" hint="Suspended or cancelled enrollments cannot access the course."><Select value={status} onChange={(e) => setStatus(e.target.value as EnrollmentStatus)}><option value="active">Active</option><option value="completed">Completed</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option></Select></Field>
        <Field label="Access until"><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
