import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarPlus, Lock, LockOpen, Pencil, Plus, Trash2, Users, Wand2 } from 'lucide-react'
import { useDB } from '@/store/db'
import { deleteIntake, saveIntake } from '@/store/actions'
import { getIntakeEnrolledCount } from '@/lib/progress'
import { makeIntake, suggestIntakeDates } from '@/data/seed'
import { Badge, Button, DataTable, EmptyState, Field, Input, Modal, PageHeader, ProgressBar, Select, useConfirm } from '@/components/ui'
import { formatDate, formatDateTime, formatLongDate } from '@/lib/utils'
import type { Intake } from '@/types'

const toLocalInput = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }

export default function AdminIntakes() {
  const db = useDB()
  const [editing, setEditing] = useState<Intake | 'new' | null>(null)
  const [viewing, setViewing] = useState<Intake | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [confirm, dialog] = useConfirm()
  const now = Date.now()
  const rows = db.intakes.filter((i) => (filter === 'all' ? true : filter === 'upcoming' ? new Date(i.date).getTime() >= now : new Date(i.date).getTime() < now))

  const generate = () => {
    const course = db.courses[0]
    if (!course) return toast.error('Create a course first.')
    const existing = new Set(db.intakes.map((i) => i.date.slice(0, 10)))
    let added = 0
    suggestIntakeDates(db.settings.intakeDays, 0, 5).filter((d) => d.getTime() > now).forEach((d) => {
      if (existing.has(d.toISOString().slice(0, 10))) return
      saveIntake(makeIntake(course.id, d, db.settings.defaultIntakeCapacity)); added++
    })
    added ? toast.success(`${added} suggested intake${added > 1 ? 's' : ''} added`, { description: `Dates on day ${db.settings.intakeDays.join(' and ')} of the next six months.` }) : toast.info('All suggested intake dates already exist.')
  }

  return (
    <>
      <PageHeader title="Intakes" description="Induction dates, registration deadlines and capacity." actions={<>
        <Button variant="outline" onClick={generate}><Wand2 className="size-4" />Generate suggested dates</Button>
        <Button onClick={() => setEditing('new')}><Plus className="size-4" />New intake</Button></>} />
      <DataTable
        rows={rows} rowKey={(i) => i.id} pageSize={10} initialSort={{ key: 'date', dir: filter === 'past' ? 'desc' : 'asc' }}
        search={(i) => i.name} searchPlaceholder="Search intakes…"
        filters={<Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Show" className="w-36"><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All</option></Select>}
        empty={{ title: 'No intakes', description: 'Create one or generate suggested monthly dates.' }}
        columns={[
          { key: 'date', header: 'Induction date', render: (i) => <div><p className="font-medium">{formatDate(i.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p><p className="text-xs text-muted">{i.name}</p></div>, sort: (i) => i.date },
          { key: 'deadline', header: 'Registration deadline', render: (i) => formatDate(i.registrationDeadline), sort: (i) => i.registrationDeadline },
          { key: 'cap', header: 'Enrolled / capacity', render: (i) => { const n = getIntakeEnrolledCount(db, i.id); return <div className="flex w-36 items-center gap-2"><ProgressBar value={(n / i.capacity) * 100} tone={n >= i.capacity ? 'amber' : 'navy'} /><span className="whitespace-nowrap text-xs text-muted">{n}/{i.capacity}</span></div> }, sort: (i) => getIntakeEnrolledCount(db, i.id) },
          { key: 'status', header: 'Registration', render: (i) => { const past = new Date(i.registrationDeadline).getTime() < now; return <Badge tone={i.status === 'open' && !past ? 'green' : 'slate'}>{i.status === 'open' ? (past ? 'Deadline passed' : 'Open') : 'Closed'}</Badge> }, sort: (i) => i.status },
          { key: 'act', header: '', className: 'text-right', render: (i) => (
            <div className="flex justify-end gap-1">
              <Button size="icon" variant="ghost" aria-label="View enrolled students" onClick={() => setViewing(i)}><Users className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={i.status === 'open' ? 'Close registrations' : 'Open registrations'} title={i.status === 'open' ? 'Close registrations' : 'Open registrations'} onClick={() => { saveIntake({ ...i, status: i.status === 'open' ? 'closed' : 'open' }); toast.success(i.status === 'open' ? 'Registrations closed' : 'Registrations opened') }}>{i.status === 'open' ? <Lock className="size-4" /> : <LockOpen className="size-4" />}</Button>
              <Button size="icon" variant="ghost" aria-label="Edit intake" onClick={() => setEditing(i)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete intake" className="text-red-600" onClick={() => confirm({ title: 'Delete intake?', description: `${i.name} will be removed.`, danger: true, confirmLabel: 'Delete', onConfirm: () => { const r = deleteIntake(i.id); r.ok ? toast.success('Intake deleted') : toast.error(r.error) } })}><Trash2 className="size-4" /></Button>
            </div>) },
        ]}
      />
      {editing && <IntakeForm key={editing === 'new' ? 'new' : editing.id} intake={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      <Modal open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} title={viewing?.name ?? ''} description={viewing ? `Induction ${formatLongDate(viewing.date)}` : undefined} size="lg" footer={<Button onClick={() => setViewing(null)}>Close</Button>}>
        {viewing && (() => {
          const list = db.enrollments.filter((e) => e.intakeId === viewing.id && e.status !== 'cancelled')
          return list.length === 0 ? <EmptyState icon={CalendarPlus} title="No enrolled students" /> : (
            <ul className="divide-y divide-line">{list.map((e) => { const u = db.users.find((x) => x.id === e.userId); return u && <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><Link to={`/admin/students/${u.id}`} className="font-medium hover:underline">{u.name}</Link><span className="text-xs text-muted">{u.email}</span><span className="text-xs text-muted">{formatDateTime(e.enrolledAt)}</span></li> })}</ul>
          )
        })()}
      </Modal>
      {dialog}
    </>
  )
}

function IntakeForm({ intake, onClose }: { intake: Intake | null; onClose: () => void }) {
  const db = useDB()
  const def = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); d.setHours(9, 0, 0, 0); return d })()
  const [date, setDate] = useState(toLocalInput(intake?.date ?? def.toISOString()))
  const [deadline, setDeadline] = useState(toLocalInput(intake?.registrationDeadline ?? new Date(def.getTime() - 3600000 * 9.01).toISOString()))
  const [capacity, setCapacity] = useState(intake?.capacity ?? db.settings.defaultIntakeCapacity)
  const [status, setStatus] = useState(intake?.status ?? 'open')
  const [name, setName] = useState(intake?.name ?? '')
  const [err, setErr] = useState<Record<string, string>>({})
  const enrolled = intake ? getIntakeEnrolledCount(db, intake.id) : 0

  const save = () => {
    const e: Record<string, string> = {}
    if (!date) e.date = 'Choose the induction date'
    if (!deadline) e.deadline = 'Choose the registration deadline'
    if (date && deadline && new Date(deadline) > new Date(date)) e.deadline = 'The deadline must be on or before the induction date'
    if (!Number.isInteger(capacity) || capacity < 1) e.capacity = 'Capacity must be at least 1'
    else if (capacity < enrolled) e.capacity = `Capacity cannot be below the ${enrolled} students already enrolled`
    setErr(e)
    if (Object.keys(e).length) return
    const d = new Date(date)
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    const id = intake?.id ?? `int-${ymd}`
    if (!intake && db.intakes.some((i) => i.id === id)) return setErr({ date: 'An intake already exists on this date' })
    saveIntake({ id, courseId: intake?.courseId ?? db.courses[0]?.id ?? '', name: name.trim() || `${formatLongDate(d.toISOString())} Intake`, date: d.toISOString(), registrationDeadline: new Date(deadline).toISOString(), capacity, status })
    toast.success(intake ? 'Intake updated' : 'Intake created'); onClose()
  }
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={intake ? 'Edit intake' : 'New intake'} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>{intake ? 'Save changes' : 'Create intake'}</Button></>}>
      <div className="space-y-4">
        <Field label="Name" hint="Leave blank to generate from the date"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Induction date & time" error={err.date}><Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Registration deadline" error={err.deadline}><Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
        <Field label="Capacity" error={err.capacity} hint={intake ? `${enrolled} currently enrolled` : undefined}><Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></Field>
        <Field label="Registration"><Select value={status} onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}><option value="open">Open</option><option value="closed">Closed</option></Select></Field>
      </div>
    </Modal>
  )
}
