import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, FileText } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { Button, Card, DataTable, EmptyState, PageHeader } from '@/components/ui'
import { PaymentBadge } from '@/components/common'
import { ReceiptModal } from '@/components/Receipt'
import { formatDateTime, formatLKR } from '@/lib/utils'
import type { Payment } from '@/types'

export default function Payments() {
  const { db, payments } = useStudent()
  const [receipt, setReceipt] = useState<Payment | null>(null)
  return (
    <>
      <PageHeader title="Payment history" description="Every payment attempt on your account." actions={<Link to="/app/enroll"><Button variant="outline">Enrollment</Button></Link>} />
      {payments.length === 0 ? (
        <Card><EmptyState icon={CreditCard} title="No payments yet" description="Your payments will appear here after you enrol." action={<Link to="/app/enroll"><Button>Enrol now</Button></Link>} /></Card>
      ) : (
        <DataTable
          rows={payments} rowKey={(p) => p.id} pageSize={8} initialSort={{ key: 'date', dir: 'desc' }}
          columns={[
            { key: 'ref', header: 'Reference', render: (p) => <span className="font-mono text-xs font-medium">{p.reference}</span>, sort: (p) => p.reference },
            { key: 'date', header: 'Date', render: (p) => formatDateTime(p.date), sort: (p) => p.date },
            { key: 'course', header: 'Course', render: (p) => db.courses.find((c) => c.id === p.courseId)?.title ?? '—' },
            { key: 'method', header: 'Method', render: (p) => (p.method === 'card' ? `Card •••• ${p.cardLast4 ?? ''}` : 'Bank transfer') },
            { key: 'amount', header: 'Amount', render: (p) => formatLKR(p.amount), sort: (p) => p.amount },
            { key: 'status', header: 'Status', render: (p) => <PaymentBadge status={p.status} />, sort: (p) => p.status },
            { key: 'act', header: '', render: (p) => <Button size="sm" variant="outline" onClick={() => setReceipt(p)}><FileText className="size-3.5" />Receipt</Button> },
          ]}
        />
      )}
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </>
  )
}
