import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Download, Eye, FileText } from 'lucide-react'
import { useDB } from '@/store/db'
import { setPaymentStatus } from '@/store/actions'
import { Button, DataTable, DescriptionList, Modal, PageHeader, Select, StatCard } from '@/components/ui'
import { PaymentBadge, exportCSV } from '@/components/common'
import { ReceiptModal } from '@/components/Receipt'
import { formatDateTime, formatLKR } from '@/lib/utils'
import { CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react'
import type { Payment, PaymentStatus } from '@/types'

export default function AdminPayments() {
  const db = useDB()
  const [status, setStatus] = useState<'all' | PaymentStatus>('all')
  const [detail, setDetail] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const rows = db.payments.filter((p) => status === 'all' || p.status === status)
  const count = (s: PaymentStatus) => db.payments.filter((p) => p.status === s).length
  const current = db.payments.find((p) => p.id === detail)
  const nameOf = (p: Payment) => db.users.find((u) => u.id === p.userId)?.name ?? '—'

  return (
    <>
      <PageHeader title="Payments" description="All payments are simulated. Update a status to see enrollment react." actions={
        <Button variant="outline" onClick={() => exportCSV('payments.csv', ['Reference', 'Student', 'Course', 'Amount (LKR)', 'Method', 'Date', 'Intake', 'Status'], rows.map((p) => [p.reference, nameOf(p), db.courses.find((c) => c.id === p.courseId)?.title, p.amount, p.method, formatDateTime(p.date), db.intakes.find((i) => i.id === p.intakeId)?.name, p.status]))}><Download className="size-4" />Export CSV</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Successful" value={count('success')} icon={CheckCircle2} tone="green" />
        <StatCard label="Pending" value={count('pending')} icon={Clock} tone="amber" />
        <StatCard label="Failed" value={count('failed')} icon={XCircle} tone="purple" />
        <StatCard label="Refunded" value={count('refunded')} icon={RotateCcw} tone="blue" />
      </div>
      <DataTable
        rows={rows} rowKey={(p) => p.id} pageSize={10} initialSort={{ key: 'date', dir: 'desc' }}
        search={(p) => `${p.reference} ${nameOf(p)}`} searchPlaceholder="Search reference or student…"
        filters={<Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status" className="w-36"><option value="all">All statuses</option><option value="success">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></Select>}
        columns={[
          { key: 'ref', header: 'Reference', render: (p) => <span className="font-mono text-xs font-medium">{p.reference}</span>, sort: (p) => p.reference },
          { key: 'student', header: 'Student', render: (p) => { const u = db.users.find((x) => x.id === p.userId); return u ? <Link to={`/admin/students/${u.id}`} className="hover:underline">{u.name}</Link> : '—' }, sort: nameOf },
          { key: 'course', header: 'Course', render: (p) => db.courses.find((c) => c.id === p.courseId)?.code ?? '—' },
          { key: 'amount', header: 'Amount', render: (p) => formatLKR(p.amount), sort: (p) => p.amount },
          { key: 'date', header: 'Payment date', render: (p) => formatDateTime(p.date), sort: (p) => p.date },
          { key: 'intake', header: 'Intake', render: (p) => db.intakes.find((i) => i.id === p.intakeId)?.name.replace(' Intake', '') ?? '—' },
          { key: 'status', header: 'Status', render: (p) => <PaymentBadge status={p.status} />, sort: (p) => p.status },
          { key: 'act', header: '', render: (p) => <Button size="sm" variant="outline" onClick={() => setDetail(p.id)}><Eye className="size-3.5" />Details</Button> },
        ]}
      />
      <Modal open={!!current} onOpenChange={(o) => !o && setDetail(null)} title="Payment details" description={current?.reference} size="lg"
        footer={current && <><Button variant="outline" onClick={() => setReceipt(current)}><FileText className="size-4" />Receipt preview</Button><Button onClick={() => setDetail(null)}>Close</Button></>}>
        {current && (
          <div className="space-y-6">
            <DescriptionList items={[['Student', nameOf(current)], ['Course', db.courses.find((c) => c.id === current.courseId)?.title ?? '—'], ['Intake', db.intakes.find((i) => i.id === current.intakeId)?.name ?? '—'], ['Amount', formatLKR(current.amount)], ['Method', current.method === 'card' ? `Card •••• ${current.cardLast4 ?? ''}` : 'Bank transfer'], ['Date', formatDateTime(current.date)], ['Status', <PaymentBadge key="s" status={current.status} />], ['Note', current.note ?? '—']]} />
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-2 text-sm font-medium">Update status (simulation)</p>
              <div className="flex flex-wrap gap-2">
                {(['success', 'pending', 'failed', 'refunded'] as PaymentStatus[]).map((s) => (
                  <Button key={s} size="sm" variant={current.status === s ? 'primary' : 'outline'} disabled={current.status === s} onClick={() => { setPaymentStatus(current.id, s); toast.success(`Payment marked as ${s}`, { description: s === 'success' ? 'The student is now enrolled.' : s === 'refunded' ? 'The related enrollment was cancelled.' : undefined }) }}>
                    {{ success: 'Mark paid', pending: 'Mark pending', failed: 'Mark failed', refunded: 'Refund' }[s]}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Marking a payment as paid creates the enrollment; refunding cancels it.</p>
            </div>
          </div>
        )}
      </Modal>
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </>
  )
}
