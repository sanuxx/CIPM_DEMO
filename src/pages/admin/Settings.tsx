import { useState } from 'react'
import { toast } from 'sonner'
import { RotateCcw, Save } from 'lucide-react'
import { useDB } from '@/store/db'
import { resetDemoData, updateSettings, saveCourse } from '@/store/actions'
import { Button, Card, CardHeader, Field, Input, PageHeader, Switch, useConfirm } from '@/components/ui'
import { formatLKR } from '@/lib/utils'
import type { Settings } from '@/types'

export default function AdminSettings() {
  const db = useDB()
  const course = db.courses[0]
  const [s, setS] = useState<Settings>(() => structuredClone(db.settings))
  const [fee, setFee] = useState(course?.fee ?? 0)
  const [days, setDays] = useState(db.settings.intakeDays.join(', '))
  const [err, setErr] = useState<Record<string, string>>({})
  const [confirm, dialog] = useConfirm()
  const patch = <K extends keyof Settings>(k: K, v: Partial<Settings[K]> | Settings[K]) => setS((x) => ({ ...x, [k]: typeof v === 'object' && !Array.isArray(v) ? { ...(x[k] as object), ...v } : v }))

  const save = () => {
    const e: Record<string, string> = {}
    const parsed = days.split(',').map((d) => d.trim()).filter(Boolean).map(Number)
    if (parsed.length === 0 || parsed.some((d) => !Number.isInteger(d) || d < 1 || d > 28)) e.days = 'Enter day numbers between 1 and 28, separated by commas'
    if (!(fee >= 0)) e.fee = 'Enter a valid fee'
    if (!Number.isInteger(s.maxQuizAttempts) || s.maxQuizAttempts < 1) e.attempts = 'At least 1 attempt'
    if (!Number.isInteger(s.accessDurationMonths) || s.accessDurationMonths < 1) e.access = 'At least 1 month'
    if (!Number.isInteger(s.defaultIntakeCapacity) || s.defaultIntakeCapacity < 1) e.cap = 'At least 1 seat'
    if (s.video.requiredWatchPercent < 10 || s.video.requiredWatchPercent > 100) e.watch = 'Enter a value between 10 and 100'
    if (!s.certificate.signatoryName.trim() || !s.certificate.numberPrefix.trim()) e.cert = 'Certificate prefix and signatory are required'
    setErr(e)
    if (Object.keys(e).length) return toast.error('Please fix the highlighted fields')
    updateSettings({ ...s, intakeDays: [...new Set(parsed)].sort((a, b) => a - b) })
    if (course && course.fee !== fee) saveCourse({ ...course, fee })
    toast.success('Settings saved', { description: 'New values apply across the student portal immediately.' })
  }

  return (
    <>
      <PageHeader title="System settings" description="Configuration for the whole portal." actions={<Button onClick={save}><Save className="size-4" />Save settings</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Enrollment" />
          <div className="space-y-4 p-5">
            <Field label="Course enrollment fee (LKR)" error={err.fee} hint={course ? `${course.title} — currently ${formatLKR(course.fee)}` : undefined}><Input type="number" min={0} step={500} value={fee} onChange={(e) => setFee(Number(e.target.value))} /></Field>
            <Field label="Induction days of the month" error={err.days} hint="Used when generating suggested intakes (default: 1, 15)"><Input value={days} onChange={(e) => setDays(e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default intake capacity" error={err.cap}><Input type="number" min={1} value={s.defaultIntakeCapacity} onChange={(e) => patch('defaultIntakeCapacity', Number(e.target.value))} /></Field>
              <Field label="Course access (months)" error={err.access}><Input type="number" min={1} value={s.accessDurationMonths} onChange={(e) => patch('accessDurationMonths', Number(e.target.value))} /></Field>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Quizzes" />
          <div className="space-y-4 p-5">
            <Field label="Default maximum quiz attempts" error={err.attempts} hint="Applies to every quiz without its own attempt limit."><Input type="number" min={1} value={s.maxQuizAttempts} onChange={(e) => patch('maxQuizAttempts', Number(e.target.value))} /></Field>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted">There is no minimum passing score: any submitted attempt completes the quiz.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Video access (demo configuration)" description="Browser-level deterrents only. Genuinely preventing recording or link sharing needs server-side DRM and expiring signed URLs in production." />
          <div className="space-y-4 p-5">
            <Switch checked={s.video.protectedPlayback !== false} onChange={(v) => patch('video', { protectedPlayback: v })} label="Protected playback" description="Hides the video source, disables download / picture-in-picture / right-click, pauses on focus loss and blanks the picture on PrintScreen." />
            <Switch checked={s.video.watermark} onChange={(v) => patch('video', { watermark: v })} label="Student watermark overlay" description="Shows the student's name and ID over the player." />
            <Switch checked={s.video.restrictForwardSeek} onChange={(v) => patch('video', { restrictForwardSeek: v })} label="Restrict skipping ahead" description="Students cannot seek beyond the furthest point watched." />
            <Switch checked={s.video.allowSpeedControl} onChange={(v) => patch('video', { allowSpeedControl: v })} label="Allow playback speed control" />
            <Field label="Required watch percentage" error={err.watch} hint="Share of the video that must be played to complete it."><Input type="number" min={10} max={100} value={s.video.requiredWatchPercent} onChange={(e) => patch('video', { requiredWatchPercent: Number(e.target.value) })} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Certificates" />
          <div className="space-y-4 p-5">
            <Switch checked={s.certificate.autoIssue} onChange={(v) => patch('certificate', { autoIssue: v })} label="Issue automatically on course completion" />
            <Field label="Certificate number prefix" error={err.cert}><Input value={s.certificate.numberPrefix} onChange={(e) => patch('certificate', { numberPrefix: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Signatory name"><Input value={s.certificate.signatoryName} onChange={(e) => patch('certificate', { signatoryName: e.target.value })} /></Field>
              <Field label="Signatory title"><Input value={s.certificate.signatoryTitle} onChange={(e) => patch('certificate', { signatoryTitle: e.target.value })} /></Field>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Notifications" description="Which events create student notifications." />
          <div className="space-y-4 p-5">
            <Switch checked={s.notifications.enrollment} onChange={(v) => patch('notifications', { enrollment: v })} label="Enrollment confirmations" />
            <Switch checked={s.notifications.payment} onChange={(v) => patch('notifications', { payment: v })} label="Payment updates" />
            <Switch checked={s.notifications.courseUpdates} onChange={(v) => patch('notifications', { courseUpdates: v })} label="Course and module updates" />
            <Switch checked={s.notifications.certificate} onChange={(v) => patch('notifications', { certificate: v })} label="Certificate issued" />
          </div>
        </Card>
        <Card className="border-red-200">
          <CardHeader title="Demo data" description="Everything in this demo lives in your browser's LocalStorage." />
          <div className="space-y-3 p-5">
            <p className="text-sm text-slate-600">Resetting restores the original students, payments, course content, intakes and settings, and removes every change you have made.</p>
            <Button variant="danger" onClick={() => confirm({ title: 'Reset all demo data?', description: 'All changes made during this demo will be lost and the original sample data restored.', danger: true, confirmLabel: 'Reset demo data', onConfirm: () => { resetDemoData(); toast.success('Demo data reset', { description: 'Original sample data restored.' }) } })}><RotateCcw className="size-4" />Reset demo data</Button>
          </div>
        </Card>
      </div>
      {dialog}
    </>
  )
}
