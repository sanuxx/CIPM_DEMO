import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronDown, Mail, Phone } from 'lucide-react'
import { Button, Card, CardHeader, Field, Input, PageHeader, Textarea } from '@/components/ui'
import { cn, sleep } from '@/lib/utils'

const FAQ: [string, string][] = [
  ['How do I unlock the next module?', 'Modules 1–4 are sequential: complete every lesson in a module to unlock the next one. Modules 5–8 are independent and open from the day you enrol.'],
  ['What does it mean to complete a lesson?', 'Each lesson has three steps in order: open all learning materials, watch the lecture video, then submit the lesson quiz. When all three are done the lesson is marked complete.'],
  ['Is there a pass mark for quizzes?', 'No. Any submitted quiz attempt counts as completion. You can retake a quiz until you reach the attempt limit shown on the quiz page.'],
  ['Can I download the learning materials?', 'Documents marked as downloadable have a download button. In this demo, downloads are plain-text summaries of the sample files.'],
  ['When do I get my certificate?', 'Your certificate is generated automatically once all eight modules are complete. You can preview, download and print it under My Certificates.'],
  ['How long do I have access?', 'Course access runs for the period shown on your dashboard (set by eArrow administration, 12 months by default in this demo).'],
]
const schema = z.object({ subject: z.string().trim().min(5, 'Enter a short subject'), message: z.string().trim().min(15, 'Please describe your question in a little more detail') })

export default function Help() {
  const [open, setOpen] = useState(0)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  return (
    <>
      <PageHeader title="Help & support" description="Answers to common questions, or send us a message." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Frequently asked questions" />
          <ul className="divide-y divide-line">
            {FAQ.map(([q, a], i) => (
              <li key={q}>
                <button className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                  {q}<ChevronDown className={cn('size-4 shrink-0 text-slate-400 transition-transform', open === i && 'rotate-180')} />
                </button>
                {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>}
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Contact support" description="Demo: messages are not sent anywhere." />
            <form noValidate className="space-y-4 p-5" onSubmit={handleSubmit(async () => { await sleep(700); toast.success('Message sent', { description: 'Our team will reply within one working day (simulated).' }); reset() })}>
              <Field label="Subject" error={errors.subject?.message}><Input {...register('subject')} /></Field>
              <Field label="Message" error={errors.message?.message}><Textarea rows={5} {...register('message')} /></Field>
              <Button type="submit" loading={isSubmitting}>Send message</Button>
            </form>
          </Card>
          <Card className="space-y-3 p-5 text-sm">
            <p className="flex items-center gap-3"><Mail className="size-4 text-navy-600" />support@earrowdemo.example</p>
            <p className="flex items-center gap-3"><Phone className="size-4 text-navy-600" />+94 11 258 9000 · Mon–Fri, 8.30 a.m. – 5.00 p.m.</p>
          </Card>
        </div>
      </div>
    </>
  )
}
