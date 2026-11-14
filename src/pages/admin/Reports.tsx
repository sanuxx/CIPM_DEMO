import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useDB } from '@/store/db'
import { moduleCompletion, quizPerformance, studentRow, students } from '@/lib/analytics'
import { Badge, Button, Card, DataTable, Input, PageHeader, ProgressBar, Select, Tabs, type Column } from '@/components/ui'
import { PaymentBadge, exportCSV } from '@/components/common'
import { formatDate, formatDateTime, formatLKR } from '@/lib/utils'

type Tab = 'enrollment' | 'revenue' | 'progress' | 'modules' | 'quizzes' | 'activity'
const TABS: { id: Tab; label: string }[] = [
  { id: 'enrollment', label: 'Enrollment' }, { id: 'revenue', label: 'Revenue' }, { id: 'progress', label: 'Student progress' },
  { id: 'modules', label: 'Module completion' }, { id: 'quizzes', label: 'Quiz performance' }, { id: 'activity', label: 'Student activity' },
]

export default function AdminReports() {
  const db = useDB()
  const [tab, setTab] = useState<Tab>('enrollment')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [intake, setIntake] = useState('all')
  const [pay, setPay] = useState('all')

  const inRange = (iso: string) => (!from || iso.slice(0, 10) >= from) && (!to || iso.slice(0, 10) <= to)
  const intakes = [...db.intakes].sort((a, b) => b.date.localeCompare(a.date))
  const courseId = db.courses[0]?.id ?? ''

  const report = useMemo(() => {
    const userName = (id: string) => db.users.find((u) => u.id === id)?.name ?? '—'
    switch (tab) {
      case 'enrollment': {
        const data = db.enrollments.filter((e) => inRange(e.enrolledAt) && (intake === 'all' || e.intakeId === intake))
        const columns: Column<(typeof data)[number]>[] = [
          { key: 's', header: 'Student', render: (e) => userName(e.userId), sort: (e) => userName(e.userId) },
          { key: 'c', header: 'Course', render: (e) => db.courses.find((c) => c.id === e.courseId)?.code ?? '' },
          { key: 'i', header: 'Intake', render: (e) => formatDate(db.intakes.find((i) => i.id === e.intakeId)?.date) },
          { key: 'st', header: 'Status', render: (e) => <Badge className="capitalize">{e.status}</Badge>, sort: (e) => e.status },
          { key: 'd', header: 'Enrolled', render: (e) => formatDate(e.enrolledAt), sort: (e) => e.enrolledAt },
        ]
        return { data, columns, key: (e: (typeof data)[number]) => e.id, csv: ['enrollments.csv', ['Student', 'Email', 'Intake', 'Status', 'Enrolled'], data.map((e) => [userName(e.userId), db.users.find((u) => u.id === e.userId)?.email, db.intakes.find((i) => i.id === e.intakeId)?.name, e.status, formatDate(e.enrolledAt)])] as const, summary: `${data.length} enrollments` }
      }
      case 'revenue': {
        const data = db.payments.filter((p) => inRange(p.date) && (intake === 'all' || p.intakeId === intake) && (pay === 'all' || p.status === pay))
        const total = data.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0)
        const columns: Column<(typeof data)[number]>[] = [
          { key: 'r', header: 'Reference', render: (p) => <span className="font-mono text-xs">{p.reference}</span>, sort: (p) => p.reference },
          { key: 's', header: 'Student', render: (p) => userName(p.userId), sort: (p) => userName(p.userId) },
          { key: 'a', header: 'Amount', render: (p) => formatLKR(p.amount), sort: (p) => p.amount },
          { key: 'd', header: 'Date', render: (p) => formatDateTime(p.date), sort: (p) => p.date },
          { key: 'st', header: 'Status', render: (p) => <PaymentBadge status={p.status} />, sort: (p) => p.status },
        ]
        return { data, columns, key: (p: (typeof data)[number]) => p.id, csv: ['revenue.csv', ['Reference', 'Student', 'Amount (LKR)', 'Date', 'Status'], data.map((p) => [p.reference, userName(p.userId), p.amount, formatDateTime(p.date), p.status])] as const, summary: `${formatLKR(total)} collected from ${data.filter((p) => p.status === 'success').length} successful payments` }
      }
      case 'progress': {
        const data = students(db).map((u) => studentRow(db, u)).filter((r) => r.enrollment && inRange(r.enrollment.enrolledAt) && (intake === 'all' || r.intake?.id === intake))
        const columns: Column<(typeof data)[number]>[] = [
          { key: 's', header: 'Student', render: (r) => r.user.name, sort: (r) => r.user.name },
          { key: 'm', header: 'Modules', render: (r) => `${r.stats?.modulesDone ?? 0}/${r.stats?.modulesTotal ?? 0}`, sort: (r) => r.stats?.modulesDone ?? 0 },
          { key: 'l', header: 'Lessons', render: (r) => `${r.stats?.lessonsDone ?? 0}/${r.stats?.lessonsTotal ?? 0}`, sort: (r) => r.stats?.lessonsDone ?? 0 },
          { key: 'q', header: 'Avg quiz', render: (r) => (r.stats?.averageScore == null ? '—' : `${r.stats.averageScore}%`), sort: (r) => r.stats?.averageScore ?? -1 },
          { key: 'p', header: 'Progress', render: (r) => <div className="flex w-28 items-center gap-2"><ProgressBar value={r.stats?.percent ?? 0} /><span className="text-xs text-muted">{r.stats?.percent ?? 0}%</span></div>, sort: (r) => r.stats?.percent ?? 0 },
        ]
        return { data, columns, key: (r: (typeof data)[number]) => r.user.id, csv: ['student-progress.csv', ['Student', 'Email', 'Modules done', 'Lessons done', 'Avg quiz %', 'Progress %'], data.map((r) => [r.user.name, r.user.email, r.stats?.modulesDone, r.stats?.lessonsDone, r.stats?.averageScore ?? '', r.stats?.percent])] as const, summary: `${data.length} enrolled students` }
      }
      case 'modules': {
        const data = moduleCompletion(db, courseId)
        const columns: Column<(typeof data)[number]>[] = [
          { key: 'm', header: 'Module', render: (r) => `${r.module.order}. ${r.module.title}`, sort: (r) => r.module.order },
          { key: 'p', header: 'Type', render: (r) => <Badge tone={r.module.progression === 'sequential' ? 'amber' : 'green'}>{r.module.progression}</Badge> },
          { key: 's', header: 'Started', render: (r) => r.started, sort: (r) => r.started },
          { key: 'c', header: 'Completed', render: (r) => r.completed, sort: (r) => r.completed },
          { key: 'r', header: 'Completion rate', render: (r) => <div className="flex w-32 items-center gap-2"><ProgressBar value={r.rate} /><span className="text-xs text-muted">{r.rate}%</span></div>, sort: (r) => r.rate },
        ]
        return { data, columns, key: (r: (typeof data)[number]) => r.module.id, csv: ['module-completion.csv', ['Module', 'Progression', 'Enrolled', 'Started', 'Completed', 'Completion %'], data.map((r) => [r.module.title, r.module.progression, r.enrolled, r.started, r.completed, r.rate])] as const, summary: `${data[0]?.enrolled ?? 0} enrolled students` }
      }
      case 'quizzes': {
        const data = quizPerformance(db).filter((r) => r.attempts > 0 || true)
        const columns: Column<(typeof data)[number]>[] = [
          { key: 'q', header: 'Quiz', render: (r) => <div><p className="font-medium">{r.lesson?.title ?? r.quiz.title}</p><p className="text-xs text-muted">Module {r.module?.order}</p></div>, sort: (r) => (r.module?.order ?? 0) * 10 + (r.lesson?.order ?? 0) },
          { key: 'a', header: 'Attempts', render: (r) => r.attempts, sort: (r) => r.attempts },
          { key: 's', header: 'Students', render: (r) => r.students, sort: (r) => r.students },
          { key: 'avg', header: 'Average', render: (r) => (r.average == null ? '—' : `${r.average}%`), sort: (r) => r.average ?? -1 },
          { key: 'hi', header: 'Highest', render: (r) => (r.highest == null ? '—' : `${r.highest}%`), sort: (r) => r.highest ?? -1 },
          { key: 'lo', header: 'Lowest', render: (r) => (r.lowest == null ? '—' : `${r.lowest}%`), sort: (r) => r.lowest ?? -1 },
        ]
        return { data, columns, key: (r: (typeof data)[number]) => r.quiz.id, csv: ['quiz-performance.csv', ['Quiz', 'Module', 'Attempts', 'Students', 'Average %', 'Highest %', 'Lowest %'], data.map((r) => [r.quiz.title, r.module?.order, r.attempts, r.students, r.average ?? '', r.highest ?? '', r.lowest ?? ''])] as const, summary: `${db.attempts.length} attempts across ${data.length} quizzes` }
      }
      case 'activity': {
        const data = db.activities.filter((a) => a.type !== 'registered' && inRange(a.at)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 500)
        const columns: Column<(typeof data)[number]>[] = [
          { key: 'd', header: 'When', render: (a) => formatDateTime(a.at), sort: (a) => a.at },
          { key: 's', header: 'Student', render: (a) => userName(a.userId), sort: (a) => userName(a.userId) },
          { key: 't', header: 'Type', render: (a) => <Badge className="capitalize">{a.type.replace('_', ' ')}</Badge>, sort: (a) => a.type },
          { key: 'x', header: 'Activity', className: 'min-w-72 whitespace-normal', render: (a) => a.text },
        ]
        return { data, columns, key: (a: (typeof data)[number]) => a.id, csv: ['student-activity.csv', ['When', 'Student', 'Type', 'Activity'], data.map((a) => [formatDateTime(a.at), userName(a.userId), a.type, a.text])] as const, summary: `${data.length} events (latest 500 shown)` }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, tab, from, to, intake, pay, courseId])

  const dateFilters = tab === 'enrollment' || tab === 'revenue' || tab === 'progress' || tab === 'activity'
  const intakeFilter = tab === 'enrollment' || tab === 'revenue' || tab === 'progress'

  return (
    <>
      <PageHeader title="Reports" description="Filter, review and export operational reports as CSV." actions={<Button onClick={() => (report.csv[2].length ? exportCSV(report.csv[0], [...report.csv[1]], report.csv[2].map((r) => [...r])) : undefined)} disabled={report.csv[2].length === 0}><Download className="size-4" />Export CSV</Button>} />
      <Tabs className="mb-5" tabs={TABS} value={tab} onChange={setTab} />
      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        {dateFilters && <>
          <label className="text-xs text-muted">From<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-40" /></label>
          <label className="text-xs text-muted">To<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-40" /></label>
        </>}
        {intakeFilter && <label className="text-xs text-muted">Intake<Select value={intake} onChange={(e) => setIntake(e.target.value)} className="mt-1 w-48"><option value="all">All intakes</option>{intakes.map((i) => <option key={i.id} value={i.id}>{formatDate(i.date)}</option>)}</Select></label>}
        {tab === 'revenue' && <label className="text-xs text-muted">Status<Select value={pay} onChange={(e) => setPay(e.target.value)} className="mt-1 w-36"><option value="all">All</option><option value="success">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></Select></label>}
        {(from || to || intake !== 'all' || pay !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); setIntake('all'); setPay('all') }}>Clear filters</Button>}
        <p className="ml-auto text-sm font-medium text-slate-600">{report.summary}</p>
      </Card>
      {/* generic table; each report supplies its own columns */}
      <DataTable key={tab} rows={report.data as never[]} columns={report.columns as Column<never>[]} rowKey={report.key as (r: never) => string} pageSize={10} empty={{ title: 'No data for these filters' }} />
    </>
  )
}
