import type { Question, Quiz } from '@/types'

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

export const TF_OPTIONS = [
  { id: 'true', text: 'True' },
  { id: 'false', text: 'False' },
]

export function questionOptions(q: Question) {
  return q.type === 'tf' ? TF_OPTIONS : q.options
}

export function isAnswered(q: Question, answer: string[] | undefined) {
  if (!answer || answer.length === 0) return false
  return q.type === 'blank' ? norm(answer[0] ?? '') !== '' : true
}

export function isCorrect(q: Question, answer: string[] | undefined) {
  if (!isAnswered(q, answer)) return false
  const a = answer as string[]
  switch (q.type) {
    case 'mcq':
    case 'tf':
      return a[0] === q.correct[0]
    case 'multi':
      return a.length === q.correct.length && q.correct.every((c) => a.includes(c))
    case 'blank':
      return q.correct.some((c) => norm(c) === norm(a[0]))
  }
}

export function gradeQuiz(quiz: Quiz, answers: Record<string, string[]>) {
  let score = 0
  let total = 0
  for (const q of quiz.questions) {
    total += q.marks
    if (isCorrect(q, answers[q.id])) score += q.marks
  }
  return { score, total, percent: total ? Math.round((score / total) * 100) : 0 }
}

/** human-readable correct answer */
export function correctAnswerText(q: Question) {
  if (q.type === 'blank') return q.correct[0] ?? ''
  const opts = questionOptions(q)
  return q.correct.map((id) => opts.find((o) => o.id === id)?.text ?? '').filter(Boolean).join(', ')
}

export function answerText(q: Question, answer: string[] | undefined) {
  if (!isAnswered(q, answer)) return 'Not answered'
  if (q.type === 'blank') return (answer as string[])[0]
  const opts = questionOptions(q)
  return (answer as string[]).map((id) => opts.find((o) => o.id === id)?.text ?? '').filter(Boolean).join(', ')
}

export const QUESTION_TYPE_LABEL: Record<Question['type'], string> = {
  mcq: 'Multiple choice',
  multi: 'Multiple select',
  tf: 'True / False',
  blank: 'Fill in the blank',
}

export function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
