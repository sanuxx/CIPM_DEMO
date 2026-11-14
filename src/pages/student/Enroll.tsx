import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft, Banknote, CalendarDays, Check, CheckCircle2, Clock, CreditCard, FileText, Lock, ShieldCheck } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { processPayment } from '@/store/actions'
import { getIntakeEnrolledCount, getOpenIntakes, getCourseLessons, getCourseModules } from '@/lib/progress'
import { Badge, Button, Card, CardHeader, DescriptionList, EmptyState, Field, Input, ProgressBar, Select } from '@/components/ui'
import { CoverArt, PaymentBadge } from '@/components/common'
import { ReceiptModal } from '@/components/Receipt'
import { cn, formatDate, formatLKR, formatLongDate, sleep } from '@/lib/utils'
import type { Payment, PaymentMethod } from '@/types'

const cardSchema = z.object({
  holder: z.string().trim().min(3, 'Enter the name on the card'),
  number: z.string().refine((v) => /^\d{16}$/.test(v.replace(/\s/g, '')), 'Enter a 16-digit card number'),
  expiry: z.string().refine((v) => {
    const m = /^(\d{2})\/(\d{2})$/.exec(v)
    if (!m) return false
    const mm = Number(m[1]), yy = 2000 + Number(m[2])
    return mm >= 1 && mm <= 12 && new Date(yy, mm, 0, 23, 59).getTime() >= Date.now()
  }, 'Use a future date as MM/YY'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Enter the 3 or 4 digit code'),
  simulate: z.enum(['success', 'failed']),
})
type CardValues = z.infer<typeof cardSchema>
const STEPS = ['Induction date', 'Review', 'Payment', 'Confirmation']

export default function Enroll() {
  const s = useStudent()
  const { db, user, course, enrollment } = s
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [intakeId, setIntakeId] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [processing, setProcessing] = useState(false)
  const [phase, setPhase] = useState(0)
  const [result, setResult] = useState<Payment | null>(null)
  const [receipt, setReceipt] = useState<Payment | null>(null)

  const form = useForm<CardValues>({ resolver: zodResolver(cardSchema), defaultValues: { holder: user.name, number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123', simulate: 'success' } })
  const intakes = useMemo(() => (course ? getOpenIntakes(db, course.id) : []), [db, course])
  const intake = intakes.find((i) => i.id === intakeId) ?? db.intakes.find((i) => i.id === intakeId)

  if (!course) return <EmptyState title="No course available" description="There is no published course to enrol in right now." />

  // Already enrolled and not mid-flow: show status instead of a new enrollment.
  if (enrollment && !result) {
    const payment = db.payments.find((p) => p.id === enrollment.paymentId)
    return (
      <Card className="mx-auto max-w-xl">
        <EmptyState
          icon={CheckCircle2} title={enrollment.status === 'suspended' ? 'Your enrollment is suspended' : 'You are already enrolled'}
          description={enrollment.status === 'suspended' ? 'Please contact CIPM administration to restore access to your course.' : `You are enrolled in ${course.title}.`}
          action={<div className="flex gap-2">{payment && <Button variant="outline" onClick={() => setReceipt(payment)}>View receipt</Button>}<Link to="/app"><Button>Go to dashboard</Button></Link></div>}
        />
        <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
      </Card>
    )
  }

  const pendingPayment = s.payments.find((p) => p.status === 'pending')
  const pay = async (v: CardValues | null) => {
    setProcessing(true)
    setPhase(0)
    const phases = method === 'card' ? 3 : 2
    for (let i = 1; i <= phases; i++) { await sleep(900); setPhase(i) }
    await sleep(500)
    const payment = processPayment({
      userId: user.id, courseId: course.id, intakeId, method,
      cardLast4: v ? v.number.replace(/\s/g, '').slice(-4) : undefined,
      simulate: v?.simulate ?? 'success',
    })
    setResult(payment)
    setProcessing(false)
    setStep(3)
    if (payment.status === 'success') toast.success('Payment successful', { description: `Reference ${payment.reference}` })
    else if (payment.status === 'failed') toast.error('Payment failed', { description: 'Your card was declined (simulated). You can try again.' })
    else toast.info('Bank transfer submitted', { description: 'Awaiting verification by CIPM (simulated).' })
  }

  const phaseLabels = method === 'card' ? ['Contacting payment gateway…', 'Authorising card…', 'Confirming payment…'] : ['Submitting transfer details…', 'Recording payment…']

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Enrol in {course.title}</h1>
      <p className="mt-1 text-sm text-muted">Choose an induction date and complete a simulated payment. No real money is taken.</p>

      {pendingPayment && !result && (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Clock className="mt-0.5 size-4 shrink-0" />
          <p>You have a bank transfer ({pendingPayment.reference}) awaiting verification. Course access starts once CIPM confirms it. You can still start a new payment below.</p>
        </div>
      )}

      <ol className="my-7 flex items-center gap-2 overflow-x-auto" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex shrink-0 items-center gap-2">
            <span className={cn('flex size-7 items-center justify-center rounded-full text-xs font-semibold', i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-navy-800 text-white' : 'bg-slate-200 text-slate-500')}>
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn('text-sm', i === step ? 'font-semibold text-ink' : 'text-muted')}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-slate-300 sm:w-10" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          {step === 0 && (
            <Card>
              <CardHeader title="Select an induction date" description="Inductions are held on the 1st and 15th of each month." />
              <div className="grid gap-3 p-5 sm:grid-cols-2" role="radiogroup" aria-label="Induction date">
                {intakes.map((i) => {
                  const left = i.capacity - getIntakeEnrolledCount(db, i.id)
                  const sel = i.id === intakeId
                  return (
                    <button
                      key={i.id} role="radio" aria-checked={sel} onClick={() => setIntakeId(i.id)}
                      className={cn('rounded-xl border p-4 text-left transition', sel ? 'border-navy-600 bg-navy-50 ring-2 ring-navy-200' : 'border-line hover:border-navy-300')}
                    >
                      <div className="flex items-center gap-2"><CalendarDays className="size-4 text-navy-600" /><span className="text-sm font-semibold">{formatDate(i.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                      <p className="mt-1 text-xs text-muted">Register by {formatDate(i.registrationDeadline)}</p>
                      <div className="mt-3"><ProgressBar value={((i.capacity - left) / i.capacity) * 100} /></div>
                      <p className="mt-1.5 text-xs text-muted">{left} of {i.capacity} seats left</p>
                    </button>
                  )
                })}
                {intakes.length === 0 && <div className="sm:col-span-2"><EmptyState icon={CalendarDays} title="No intakes open" description="Registration is closed for all upcoming inductions. Please check back soon." /></div>}
              </div>
              <div className="flex justify-end border-t border-line p-4"><Button disabled={!intakeId} onClick={() => setStep(1)}>Continue</Button></div>
            </Card>
          )}

          {step === 1 && intake && (
            <Card>
              <CardHeader title="Review your enrollment" />
              <div className="space-y-6 p-5">
                <DescriptionList items={[['Student', user.name], ['Student ID', user.studentNo ?? '—'], ['Email', user.email], ['Phone', user.phone], ['Course', course.title], ['Induction date', formatLongDate(intake.date)]]} />
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Course fee</span><span>{formatLKR(course.fee)}</span></div>
                  <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-semibold"><span>Total due</span><span>{formatLKR(course.fee)}</span></div>
                </div>
              </div>
              <div className="flex justify-between border-t border-line p-4"><Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="size-4" />Back</Button><Button onClick={() => setStep(2)}>Proceed to payment</Button></div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader title="Payment" description="Secure payment is simulated in this demo." />
              {processing ? (
                <div className="flex flex-col items-center gap-4 px-6 py-14 text-center" aria-live="polite">
                  <div className="size-14 animate-spin rounded-full border-4 border-navy-100 border-t-navy-700" />
                  <p className="font-medium">{phaseLabels[Math.min(phase, phaseLabels.length - 1)]}</p>
                  <div className="w-64"><ProgressBar value={((phase + 1) / (phaseLabels.length + 1)) * 100} /></div>
                  <p className="text-xs text-muted">Please do not close this page.</p>
                </div>
              ) : (
                <form onSubmit={method === 'card' ? form.handleSubmit(pay) : (e) => { e.preventDefault(); void pay(null) }} noValidate>
                  <div className="space-y-5 p-5">
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                      {([['card', CreditCard, 'Credit / debit card', 'Instant confirmation'], ['bank', Banknote, 'Bank transfer', 'Verified by CIPM staff']] as const).map(([id, Icon, t, d]) => (
                        <button type="button" key={id} role="radio" aria-checked={method === id} onClick={() => setMethod(id)}
                          className={cn('flex items-center gap-3 rounded-xl border p-4 text-left', method === id ? 'border-navy-600 bg-navy-50 ring-2 ring-navy-200' : 'border-line hover:border-navy-300')}>
                          <Icon className="size-5 text-navy-700" /><span><span className="block text-sm font-medium">{t}</span><span className="text-xs text-muted">{d}</span></span>
                        </button>
                      ))}
                    </div>
                    {method === 'card' ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name on card" className="sm:col-span-2" error={form.formState.errors.holder?.message}><Input {...form.register('holder')} autoComplete="cc-name" /></Field>
                        <Field label="Card number" className="sm:col-span-2" error={form.formState.errors.number?.message}><Input {...form.register('number')} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" /></Field>
                        <Field label="Expiry (MM/YY)" error={form.formState.errors.expiry?.message}><Input {...form.register('expiry')} autoComplete="cc-exp" placeholder="MM/YY" /></Field>
                        <Field label="CVC" error={form.formState.errors.cvc?.message}><Input {...form.register('cvc')} inputMode="numeric" autoComplete="cc-csc" type="password" /></Field>
                        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 sm:col-span-2">
                          <Field label="Demo control: simulated gateway response" hint="Use this to demonstrate both a successful and a declined payment.">
                            <Select {...form.register('simulate')}><option value="success">Payment succeeds</option><option value="failed">Payment is declined</option></Select>
                          </Field>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                        <p className="font-medium">Transfer {formatLKR(course.fee)} to:</p>
                        <p className="mt-2">Account name: CIPM Learning (Demo)<br />Bank: Demo Bank PLC · Branch: Colombo 03<br />Account no.: 0000 1234 5678</p>
                        <p className="mt-3 text-xs text-muted">Your payment will be recorded as <strong>Pending</strong> until an administrator verifies it. This is simulated — no transfer is needed.</p>
                      </div>
                    )}
                    <p className="flex items-center gap-2 text-xs text-muted"><Lock className="size-3.5" />Demo only — card details are never stored or sent anywhere.</p>
                  </div>
                  <div className="flex justify-between border-t border-line p-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}><ArrowLeft className="size-4" />Back</Button>
                    <Button type="submit">{method === 'card' ? `Pay ${formatLKR(course.fee)}` : 'Submit bank transfer'}</Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {step === 3 && result && (
            <Card className="p-8 text-center">
              {result.status === 'success' && (
                <>
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-9" /></div>
                  <h2 className="mt-4 text-xl font-semibold">Payment successful — you are enrolled!</h2>
                  <p className="mt-1 text-sm text-muted">A receipt has been generated and your course is ready.</p>
                </>
              )}
              {result.status === 'pending' && (
                <>
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Clock className="size-9" /></div>
                  <h2 className="mt-4 text-xl font-semibold">Transfer submitted</h2>
                  <p className="mt-1 text-sm text-muted">Your enrollment will be activated once an administrator verifies the payment. (In the demo, an admin can do this under Payments.)</p>
                </>
              )}
              {result.status === 'failed' && (
                <>
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="size-9" /></div>
                  <h2 className="mt-4 text-xl font-semibold">Payment failed</h2>
                  <p className="mt-1 text-sm text-muted">{result.note} No amount was charged.</p>
                </>
              )}
              <div className="mx-auto mt-6 max-w-sm rounded-xl bg-slate-50 p-4 text-left text-sm">
                <div className="flex justify-between"><span className="text-muted">Reference</span><span className="font-mono text-xs font-semibold">{result.reference}</span></div>
                <div className="mt-2 flex justify-between"><span className="text-muted">Amount</span><span>{formatLKR(result.amount)}</span></div>
                <div className="mt-2 flex justify-between"><span className="text-muted">Status</span><PaymentBadge status={result.status} /></div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {result.status === 'failed' ? (
                  <Button onClick={() => { setResult(null); setStep(2) }}>Try again</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setReceipt(result)}><FileText className="size-4" />View receipt</Button>
                    <Button onClick={() => navigate(result.status === 'success' ? '/app' : '/app/payments')}>{result.status === 'success' ? 'Go to my dashboard' : 'View payment history'}</Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit overflow-hidden">
          <div className="aspect-[16/7]"><CoverArt seed={course.id} label={course.code} src={course.thumbnail} /></div>
          <div className="space-y-3 p-5 text-sm">
            <h3 className="font-semibold leading-snug">{course.title}</h3>
            <div className="flex flex-wrap gap-2"><Badge tone="navy">{getCourseModules(db, course.id).length} modules</Badge><Badge tone="navy">{getCourseLessons(db, course.id).length} lessons</Badge><Badge tone="navy">{course.durationMonths} months</Badge></div>
            <div className="border-t border-line pt-3">
              <div className="flex justify-between"><span className="text-muted">Intake</span><span className="text-right font-medium">{intake ? formatDate(intake.date) : 'Not selected'}</span></div>
              <div className="mt-2 flex justify-between"><span className="text-muted">Total</span><span className="font-semibold">{formatLKR(course.fee)}</span></div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-3.5" />Simulated checkout</p>
          </div>
        </Card>
      </div>
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </div>
  )
}
