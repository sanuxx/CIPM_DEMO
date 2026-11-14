import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from 'lucide-react'
import type { Question, QuestionType, Quiz } from '@/types'
import { Badge, Button, Card, Field, Input, Modal, Select, Switch, Textarea } from './ui'
import { QuizRunner } from './QuizRunner'
import { QUESTION_TYPE_LABEL } from '@/lib/quiz'
import { saveQuiz } from '@/store/actions'
import { useDB } from '@/store/db'
import { uid } from '@/lib/utils'
import { cn } from '@/lib/utils'

const newQuestion = (type: QuestionType = 'mcq'): Question => {
  const base = { id: uid('q'), type, text: '', marks: 1, explanation: '' }
  if (type === 'mcq' || type === 'multi') return { ...base, options: [{ id: uid('o'), text: '' }, { id: uid('o'), text: '' }, { id: uid('o'), text: '' }], correct: [] }
  if (type === 'tf') return { ...base, options: [], correct: ['true'] }
  return { ...base, options: [], correct: [''] }
}

function validate(q: Quiz): string | null {
  if (!q.title.trim()) return 'Enter a quiz title.'
  if (q.questions.length === 0) return 'Add at least one question.'
  for (const [i, x] of q.questions.entries()) {
    const n = `Question ${i + 1}`
    if (!x.text.trim()) return `${n}: enter the question text.`
    if (x.marks < 1) return `${n}: marks must be at least 1.`
    if (x.type === 'mcq' || x.type === 'multi') {
      const opts = x.options.filter((o) => o.text.trim())
      if (opts.length < 2) return `${n}: provide at least two answer options.`
      if (x.options.some((o) => !o.text.trim())) return `${n}: remove or fill empty options.`
      if (x.correct.length === 0) return `${n}: mark the correct answer.`
      if (x.type === 'mcq' && x.correct.length !== 1) return `${n}: choose exactly one correct answer.`
    }
    if (x.type === 'blank' && !x.correct.some((c) => c.trim())) return `${n}: enter at least one accepted answer.`
  }
  return null
}

export function QuizEditor({ quiz, lessonId, onClose }: { quiz: Quiz | null; lessonId?: string; onClose: () => void }) {
  const db = useDB()
  const [q, setQ] = useState<Quiz>(
    () => structuredClone(quiz) ?? {
      id: uid('quiz'), title: '', description: 'A short check on the key ideas from this lesson. There is no pass mark — submitting the quiz completes the activity.', timeLimitMin: 10, maxAttempts: null,
      shuffleQuestions: false, shuffleAnswers: true, showExplanations: true, showCorrectAnswers: true, questions: [newQuestion()],
    },
  )
  const [lesson, setLesson] = useState(lessonId ?? db.lessons.find((l) => l.quizIds.includes(quiz?.id ?? ''))?.id ?? '')
  const [preview, setPreview] = useState(false)
  const set = (patch: Partial<Quiz>) => setQ((x) => ({ ...x, ...patch }))
  const setQuestion = (i: number, patch: Partial<Question>) => setQ((x) => ({ ...x, questions: x.questions.map((y, j) => (j === i ? { ...y, ...patch } : y)) }))
  const move = (i: number, d: -1 | 1) => setQ((x) => { const a = [...x.questions]; [a[i], a[i + d]] = [a[i + d], a[i]]; return { ...x, questions: a } })

  const save = () => {
    const err = validate(q)
    if (err) return toast.error(err)
    if (!lesson) return toast.error('Choose the lesson this quiz belongs to.')
    saveQuiz({ ...q, title: q.title.trim() }, lesson)
    toast.success(quiz ? 'Quiz updated' : 'Quiz created')
    onClose()
  }

  const lessonOptions = db.lessons.map((l) => ({ l, m: db.modules.find((m) => m.id === l.moduleId) })).sort((a, b) => (a.m?.order ?? 0) - (b.m?.order ?? 0) || a.l.order - b.l.order)

  return (
    <>
      <Modal open onOpenChange={(o) => !o && onClose()} title={quiz ? 'Edit quiz' : 'New quiz'} size="xl"
        footer={<><Button variant="outline" onClick={() => { const err = validate(q); if (err) toast.error(err); else setPreview(true) }}><Eye className="size-4" />Preview</Button><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save quiz</Button></>}>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quiz title" className="sm:col-span-2"><Input value={q.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={q.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            <Field label="Lesson"><Select value={lesson} onChange={(e) => setLesson(e.target.value)}><option value="">Select a lesson…</option>{lessonOptions.map(({ l, m }) => <option key={l.id} value={l.id}>M{m?.order} · {l.title}</option>)}</Select></Field>
            <Field label="Time limit (minutes)" hint="0 means no time limit"><Input type="number" min={0} value={q.timeLimitMin} onChange={(e) => set({ timeLimitMin: Math.max(0, Number(e.target.value) || 0) })} /></Field>
            <Field label="Maximum attempts" hint={`Leave blank to use the system default (${db.settings.maxQuizAttempts})`}><Input type="number" min={1} placeholder={`Default (${db.settings.maxQuizAttempts})`} value={q.maxAttempts ?? ''} onChange={(e) => set({ maxAttempts: e.target.value === '' ? null : Math.max(1, Number(e.target.value) || 1) })} /></Field>
          </div>
          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <Switch checked={q.shuffleQuestions} onChange={(v) => set({ shuffleQuestions: v })} label="Randomise question order" />
            <Switch checked={q.shuffleAnswers} onChange={(v) => set({ shuffleAnswers: v })} label="Randomise answer order" />
            <Switch checked={q.showExplanations} onChange={(v) => set({ showExplanations: v })} label="Show explanations after submission" />
            <Switch checked={q.showCorrectAnswers} onChange={(v) => set({ showCorrectAnswers: v })} label="Show correct answers after submission" />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Questions <Badge tone="navy">{q.questions.length}</Badge></h3>
              <div className="flex gap-2">{(['mcq', 'multi', 'tf', 'blank'] as QuestionType[]).map((t) => <Button key={t} size="sm" variant="outline" onClick={() => set({ questions: [...q.questions, newQuestion(t)] })}><Plus className="size-3.5" />{QUESTION_TYPE_LABEL[t]}</Button>)}</div>
            </div>
            <div className="space-y-4">
              {q.questions.map((x, i) => (
                <Card key={x.id} className="p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-navy-50 text-xs font-bold text-navy-800">{i + 1}</span>
                    <Select className="h-9 w-44" value={x.type} aria-label="Question type" onChange={(e) => { const t = e.target.value as QuestionType; const f = newQuestion(t); setQuestion(i, { type: t, options: f.options, correct: f.correct }) }}>
                      {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>)}
                    </Select>
                    <label className="flex items-center gap-2 text-xs text-muted">Marks<Input type="number" min={1} className="h-9 w-16" value={x.marks} onChange={(e) => setQuestion(i, { marks: Math.max(1, Number(e.target.value) || 1) })} /></label>
                    <div className="ml-auto flex">
                      <Button size="icon" variant="ghost" aria-label="Move question up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Move question down" disabled={i === q.questions.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete question" className="text-red-600" onClick={() => set({ questions: q.questions.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                  <Textarea rows={2} placeholder="Question text" aria-label="Question text" value={x.text} onChange={(e) => setQuestion(i, { text: e.target.value })} />
                  <div className="mt-3 space-y-2">
                    {(x.type === 'mcq' || x.type === 'multi') && (
                      <>
                        {x.options.map((o, oi) => {
                          const on = x.correct.includes(o.id)
                          return (
                            <div key={o.id} className="flex items-center gap-2">
                              <input type={x.type === 'mcq' ? 'radio' : 'checkbox'} name={`c-${x.id}`} checked={on} aria-label="Correct answer" className="size-4 accent-emerald-600"
                                onChange={() => setQuestion(i, { correct: x.type === 'mcq' ? [o.id] : on ? x.correct.filter((c) => c !== o.id) : [...x.correct, o.id] })} />
                              <Input className={cn('h-9', on && 'border-emerald-300 bg-emerald-50/50')} placeholder={`Option ${oi + 1}`} aria-label={`Option ${oi + 1}`} value={o.text} onChange={(e) => setQuestion(i, { options: x.options.map((p) => (p.id === o.id ? { ...p, text: e.target.value } : p)) })} />
                              <Button size="icon" variant="ghost" aria-label="Remove option" disabled={x.options.length <= 2} onClick={() => setQuestion(i, { options: x.options.filter((p) => p.id !== o.id), correct: x.correct.filter((c) => c !== o.id) })}><Trash2 className="size-3.5" /></Button>
                            </div>
                          )
                        })}
                        <Button size="sm" variant="ghost" onClick={() => setQuestion(i, { options: [...x.options, { id: uid('o'), text: '' }] })}><Plus className="size-3.5" />Add option</Button>
                        <p className="text-xs text-muted">{x.type === 'mcq' ? 'Select the one correct answer.' : 'Tick every correct answer.'}</p>
                      </>
                    )}
                    {x.type === 'tf' && (
                      <div className="flex gap-4 text-sm">{[['true', 'True'], ['false', 'False']].map(([v, l]) => <label key={v} className="flex items-center gap-2"><input type="radio" name={`tf-${x.id}`} className="size-4 accent-emerald-600" checked={x.correct[0] === v} onChange={() => setQuestion(i, { correct: [v] })} />{l} is correct</label>)}</div>
                    )}
                    {x.type === 'blank' && (
                      <Field label="Accepted answers" hint="Separate alternatives with commas. Matching ignores case and extra spaces."><Input value={x.correct.join(', ')} onChange={(e) => setQuestion(i, { correct: e.target.value.split(',').map((s) => s.trimStart()) })} onBlur={() => setQuestion(i, { correct: x.correct.map((s) => s.trim()).filter(Boolean) })} /></Field>
                    )}
                    <Input className="h-9" placeholder="Explanation shown after submission (optional)" aria-label="Explanation" value={x.explanation} onChange={(e) => setQuestion(i, { explanation: e.target.value })} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      <Modal open={preview} onOpenChange={setPreview} title="Quiz preview" description="Preview mode — no attempt is recorded." size="lg">
        {preview && <QuizRunner quiz={{ ...q, questions: q.questions.map((x) => (x.type === 'blank' ? { ...x, correct: x.correct.map((s) => s.trim()).filter(Boolean) } : x)) }} lessonId={lesson} userId="preview-admin" preview />}
      </Modal>
    </>
  )
}
