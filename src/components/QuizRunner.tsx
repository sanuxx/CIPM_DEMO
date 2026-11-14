import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Clock, History, RotateCcw, XCircle } from 'lucide-react'
import type { Question, Quiz, QuizAttempt } from '@/types'
import { Badge, Button, Card, ProgressBar } from './ui'
import { answerText, correctAnswerText, isAnswered, isCorrect, questionOptions, QUESTION_TYPE_LABEL, shuffle } from '@/lib/quiz'
import { cn, formatDateTime, formatDuration } from '@/lib/utils'
import { submitQuiz } from '@/store/actions'
import { useDB } from '@/store/db'
import { maxAttemptsFor } from '@/lib/progress'

type Phase = 'intro' | 'taking' | 'result'

export function QuizRunner({ quiz, lessonId, userId, locked, lockedReason, preview }: {
  quiz: Quiz; lessonId: string; userId: string; locked?: boolean; lockedReason?: string
  /** admin preview: never records an attempt */
  preview?: boolean
}) {
  const db = useDB()
  const attempts = useMemo(
    () => db.attempts.filter((a) => a.userId === userId && a.quizId === quiz.id).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)),
    [db.attempts, userId, quiz.id],
  )
  const max = maxAttemptsFor(db, quiz)
  const left = Math.max(0, max - attempts.length)
  const [phase, setPhase] = useState<Phase>('intro')
  const [shown, setShown] = useState<QuizAttempt | null>(null)
  const [previewAttempt, setPreviewAttempt] = useState<QuizAttempt | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [idx, setIdx] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const startedAt = useRef('')
  const submitting = useRef(false)

  // reset when navigating to a different quiz
  useEffect(() => { setPhase('intro'); setShown(null); setPreviewAttempt(null) }, [quiz.id])

  const start = () => {
    const qs = quiz.shuffleQuestions ? shuffle(quiz.questions) : quiz.questions
    setQuestions(qs.map((q) => (quiz.shuffleAnswers && (q.type === 'mcq' || q.type === 'multi') ? { ...q, options: shuffle(q.options) } : q)))
    setAnswers({})
    setIdx(0)
    setConfirming(false)
    submitting.current = false
    startedAt.current = new Date().toISOString()
    setRemaining(quiz.timeLimitMin * 60)
    setPhase('taking')
  }

  const submit = (auto = false) => {
    if (submitting.current) return
    submitting.current = true
    if (preview) {
      const g = quiz.questions.reduce((s, q) => s + (isCorrect(q, answers[q.id]) ? q.marks : 0), 0)
      const total = quiz.questions.reduce((s, q) => s + q.marks, 0)
      setPreviewAttempt({ id: 'preview', quizId: quiz.id, lessonId, userId, startedAt: startedAt.current, submittedAt: new Date().toISOString(), durationSec: 1, answers, score: g, total, percent: total ? Math.round((g / total) * 100) : 0 })
      setPhase('result')
      return
    }
    const res = submitQuiz({ userId, lessonId, quizId: quiz.id, answers, startedAt: startedAt.current })
    if (!res.ok) { toast.error(res.error); submitting.current = false; setPhase('intro'); return }
    setShown(res.data)
    setPhase('result')
    toast.success(auto ? 'Time is up — quiz submitted' : 'Quiz submitted', { description: `You scored ${res.data.score}/${res.data.total} (${res.data.percent}%).` })
  }

  const submitRef = useRef(submit)
  submitRef.current = submit
  useEffect(() => {
    if (phase !== 'taking' || quiz.timeLimitMin <= 0) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(id); setTimeout(() => submitRef.current(true), 0); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, quiz.timeLimitMin])

  const setAnswer = (q: Question, value: string[]) => setAnswers((a) => ({ ...a, [q.id]: value }))

  /* ───── result / review ───── */
  const resultAttempt = preview ? previewAttempt : shown
  if (phase === 'result' && resultAttempt) {
    return (
      <Review quiz={quiz} attempt={resultAttempt} attempts={attempts} left={preview ? 1 : left} onRetake={start} onClose={() => setPhase('intro')} onPick={setShown} />
    )
  }

  /* ───── taking ───── */
  if (phase === 'taking' && questions.length) {
    const q = questions[idx]
    const done = questions.filter((x) => isAnswered(x, answers[x.id])).length
    const a = answers[q.id] ?? []
    const warn = quiz.timeLimitMin > 0 && remaining <= 60
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">Question {idx + 1} of {questions.length}</p>
          {quiz.timeLimitMin > 0 && <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm', warn ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700')} role="timer"><Clock className="size-4" />{formatDuration(remaining)}</span>}
        </div>
        <ProgressBar value={(done / questions.length) * 100} />
        <Card className="p-5 sm:p-6">
          <div className="mb-1 flex items-center gap-2"><Badge tone="navy">{QUESTION_TYPE_LABEL[q.type]}</Badge><span className="text-xs text-muted">{q.marks} mark{q.marks > 1 ? 's' : ''}</span></div>
          <h3 className="text-lg font-semibold leading-snug">{q.text}</h3>
          <div className="mt-5">
            {q.type === 'blank' ? (
              <input
                value={a[0] ?? ''} onChange={(e) => setAnswer(q, [e.target.value])} placeholder="Type your answer" aria-label="Your answer" autoFocus
                className="h-11 w-full rounded-lg border border-line px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200"
              />
            ) : (
              <div className="space-y-2.5" role={q.type === 'multi' ? 'group' : 'radiogroup'}>
                {q.type === 'multi' && <p className="text-xs text-muted">Select all that apply.</p>}
                {questionOptions(q).map((o) => {
                  const sel = a.includes(o.id)
                  return (
                    <label key={o.id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition', sel ? 'border-navy-600 bg-navy-50 ring-1 ring-navy-300' : 'border-line hover:bg-slate-50')}>
                      <input
                        type={q.type === 'multi' ? 'checkbox' : 'radio'} name={q.id} checked={sel} className="size-4 accent-navy-800"
                        onChange={() => setAnswer(q, q.type === 'multi' ? (sel ? a.filter((x) => x !== o.id) : [...a, o.id]) : [o.id])}
                      />
                      {o.text}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</Button>
          <div className="hidden gap-1.5 sm:flex" aria-label="Question navigator">
            {questions.map((x, i) => (
              <button key={x.id} onClick={() => setIdx(i)} aria-label={`Go to question ${i + 1}`} aria-current={i === idx}
                className={cn('size-8 rounded-lg text-xs font-medium', i === idx ? 'bg-navy-800 text-white' : isAnswered(x, answers[x.id]) ? 'bg-navy-100 text-navy-800' : 'bg-slate-100 text-slate-500')}>{i + 1}</button>
            ))}
          </div>
          {idx < questions.length - 1 ? <Button onClick={() => setIdx(idx + 1)}>Next</Button> : <Button variant="accent" onClick={() => (done < questions.length ? setConfirming(true) : submit())}>Submit quiz</Button>}
        </div>
        {confirming && (
          <div role="alertdialog" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-amber-900"><AlertCircle className="size-4" />You have {questions.length - done} unanswered question{questions.length - done > 1 ? 's' : ''}. Submit anyway?</span>
            <span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setConfirming(false)}>Keep answering</Button><Button size="sm" onClick={() => submit()}>Submit</Button></span>
          </div>
        )}
      </div>
    )
  }

  /* ───── intro + history ───── */
  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold">{quiz.title}</h3>
        <p className="mt-1 text-sm text-muted">{quiz.description}</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[['Questions', quiz.questions.length], ['Total marks', quiz.questions.reduce((s, q) => s + q.marks, 0)], ['Time limit', quiz.timeLimitMin ? `${quiz.timeLimitMin} min` : 'None'], ['Attempts left', preview ? '∞' : `${left} of ${max}`]].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">There is no pass mark. Submitting an attempt completes this activity; you can retake while attempts remain.</p>
        <div className="mt-5">
          {locked ? <p className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600"><AlertCircle className="size-4" />{lockedReason}</p>
            : quiz.questions.length === 0 ? <p className="text-sm text-muted">This quiz has no questions yet.</p>
            : left > 0 || preview ? <Button onClick={start}>{attempts.length ? <><RotateCcw className="size-4" />Retake quiz</> : 'Start quiz'}</Button>
            : <p className="text-sm font-medium text-amber-700">You have used all {max} attempts.</p>}
        </div>
      </Card>
      {attempts.length > 0 && !preview && (
        <Card>
          <div className="flex items-center gap-2 border-b border-line px-5 py-3"><History className="size-4 text-navy-700" /><h4 className="text-sm font-semibold">Attempt history</h4></div>
          <ul className="divide-y divide-line">
            {[...attempts].reverse().map((at, i) => (
              <li key={at.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="w-20 font-medium">Attempt {attempts.length - i}</span>
                <span className="flex-1 text-xs text-muted">{formatDateTime(at.submittedAt)}</span>
                <span className="font-semibold">{at.score}/{at.total}</span>
                <Badge tone={at.percent >= 70 ? 'green' : at.percent >= 40 ? 'amber' : 'red'}>{at.percent}%</Badge>
                <Button size="sm" variant="outline" onClick={() => { setShown(at); setPhase('result') }}>Review</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Review({ quiz, attempt, attempts, left, onRetake, onClose, onPick }: {
  quiz: Quiz; attempt: QuizAttempt; attempts: QuizAttempt[]; left: number; onRetake: () => void; onClose: () => void; onPick: (a: QuizAttempt) => void
}) {
  const n = attempts.findIndex((a) => a.id === attempt.id) + 1
  return (
    <div className="space-y-5">
      <Card className="p-6 text-center">
        <div className={cn('mx-auto flex size-20 items-center justify-center rounded-full text-2xl font-bold', attempt.percent >= 70 ? 'bg-emerald-50 text-emerald-700' : attempt.percent >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>{attempt.percent}%</div>
        <h3 className="mt-3 text-xl font-semibold">{attempt.id === 'preview' ? 'Preview result' : `Attempt ${n} submitted`}</h3>
        <p className="mt-1 text-sm text-muted">You scored {attempt.score} out of {attempt.total} marks. This activity is now complete — there is no pass mark.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {left > 0 && <Button onClick={onRetake}><RotateCcw className="size-4" />Retake quiz ({left} left)</Button>}
          <Button variant="outline" onClick={onClose}>Back to quiz summary</Button>
        </div>
        {attempts.length > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">View attempt:
            {attempts.map((a, i) => <button key={a.id} onClick={() => onPick(a)} className={cn('rounded-full px-2.5 py-1', a.id === attempt.id ? 'bg-navy-800 text-white' : 'bg-slate-100 hover:bg-slate-200')}>{i + 1} · {a.percent}%</button>)}
          </div>
        )}
      </Card>
      <h4 className="text-sm font-semibold text-slate-700">Review your answers</h4>
      {quiz.questions.map((q, i) => {
        const ans = attempt.answers[q.id]
        const ok = isCorrect(q, ans)
        return (
          <Card key={q.id} className="p-5">
            <div className="flex items-start gap-3">
              {ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />}
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <p className="font-medium">{i + 1}. {q.text}</p>
                <p><span className="text-muted">Your answer: </span><span className={ok ? 'font-medium text-emerald-700' : 'font-medium text-red-600'}>{answerText(q, ans)}</span></p>
                {!ok && quiz.showCorrectAnswers && <p><span className="text-muted">Correct answer: </span><span className="font-medium text-emerald-700">{correctAnswerText(q)}</span></p>}
                {quiz.showExplanations && q.explanation && <p className="rounded-lg bg-navy-50 p-3 text-xs leading-relaxed text-navy-800"><strong>Explanation:</strong> {q.explanation}</p>}
              </div>
              <Badge tone={ok ? 'green' : 'red'}>{ok ? q.marks : 0}/{q.marks}</Badge>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
