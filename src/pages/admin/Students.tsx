import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useDB } from '@/store/db'
import { studentRow, students } from '@/lib/analytics'
import { Avatar, Button, DataTable, PageHeader, ProgressBar, Select } from '@/components/ui'
import { AccountBadge, PaymentBadge, exportCSV } from '@/components/common'
import { formatDate } from '@/lib/utils'
import type { PaymentStatus } from '@/types'

export default function AdminStudents() {
  const db = useDB()
  const navigate = useNavigate()
  const [pay, setPay] = useState<'all' | PaymentStatus | 'none'>('all')
  const [acct, setAcct] = useState<'all' | 'active' | 'inactive'>('all')
  const [intake, setIntake] = useState('all')

  const rows = useMemo(() => students(db).map((u) => studentRow(db, u)).filter((r) =>
    (pay === 'all' || (pay === 'none' ? !r.payment : r.payment?.status === pay)) &&
    (acct === 'all' || r.user.status === acct) &&
    (intake === 'all' || r.intake?.id === intake)), [db, pay, acct, intake])

  return (
    <>
      <PageHeader title="Students" description="Search, filter and manage student accounts." actions={
        <Button variant="outline" onClick={() => exportCSV('students.csv', ['Student ID', 'Name', 'Email', 'Phone', 'Course', 'Intake', 'Payment', 'Progress %', 'Enrolled', 'Account'],
          rows.map((r) => [r.user.studentNo, r.user.name, r.user.email, r.user.phone, r.course?.title ?? '', r.intake?.name ?? '', r.payment?.status ?? 'none', r.stats?.percent ?? 0, r.enrollment ? formatDate(r.enrollment.enrolledAt) : '', r.user.status]))}><Download className="size-4" />Export CSV</Button>} />
      <DataTable
        rows={rows} rowKey={(r) => r.user.id} pageSize={10} onRowClick={(r) => navigate(`/admin/students/${r.user.id}`)}
        search={(r) => `${r.user.studentNo} ${r.user.name} ${r.user.email} ${r.user.phone}`} searchPlaceholder="Search name, email, phone or ID…"
        filters={<>
          <Select value={pay} onChange={(e) => setPay(e.target.value as typeof pay)} aria-label="Payment status" className="w-44"><option value="all">All payments</option><option value="success">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option><option value="none">No payment</option></Select>
          <Select value={acct} onChange={(e) => setAcct(e.target.value as typeof acct)} aria-label="Account status" className="w-44"><option value="all">All accounts</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
          <Select value={intake} onChange={(e) => setIntake(e.target.value)} aria-label="Intake" className="w-44"><option value="all">All intakes</option>{[...db.intakes].sort((a, b) => b.date.localeCompare(a.date)).map((i) => <option key={i.id} value={i.id}>{formatDate(i.date)}</option>)}</Select>
        </>}
        columns={[
          { key: 'id', header: 'Student ID', render: (r) => <span className="font-mono text-xs">{r.user.studentNo}</span>, sort: (r) => r.user.studentNo ?? '' },
          { key: 'name', header: 'Name', render: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.user.name} photo={r.user.photo} size={30} /><span className="font-medium">{r.user.name}</span></div>, sort: (r) => r.user.name },
          { key: 'email', header: 'Email', render: (r) => r.user.email, sort: (r) => r.user.email },
          { key: 'phone', header: 'Phone', render: (r) => <span className="whitespace-nowrap">{r.user.phone}</span> },
          { key: 'course', header: 'Course', render: (r) => r.course?.code ?? <span className="text-muted">—</span> },
          { key: 'intake', header: 'Intake', render: (r) => (r.intake ? formatDate(r.intake.date) : <span className="text-muted">—</span>), sort: (r) => r.intake?.date ?? '' },
          { key: 'pay', header: 'Payment', render: (r) => (r.payment ? <PaymentBadge status={r.payment.status} /> : <span className="text-muted">None</span>), sort: (r) => r.payment?.status ?? 'zzz' },
          { key: 'prog', header: 'Progress', render: (r) => (r.stats ? <div className="flex w-28 items-center gap-2"><ProgressBar value={r.stats.percent} /><span className="w-8 text-xs text-muted">{r.stats.percent}%</span></div> : <span className="text-muted">—</span>), sort: (r) => r.stats?.percent ?? -1 },
          { key: 'enr', header: 'Enrolled', render: (r) => (r.enrollment ? formatDate(r.enrollment.enrolledAt) : '—'), sort: (r) => r.enrollment?.enrolledAt ?? '' },
          { key: 'acct', header: 'Account', render: (r) => <AccountBadge status={r.user.status} />, sort: (r) => r.user.status },
        ]}
      />
    </>
  )
}
