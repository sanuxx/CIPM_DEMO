/**
 * Mutating business logic that operates on a DB draft.
 * Used both by the store actions and by the seed generator so that seeded
 * demo data is produced by exactly the same rules as live interactions.
 */
import type {
  ActivityType, Certificate, Course, DB, Enrollment, Intake, LessonProgress, Notification, Payment, PaymentStatus, Quiz, QuizAttempt, User,
} from '@/types'
import { gradeQuiz } from '@/lib/quiz'
import { getCourseStats, getEnrollment, getLessonState, getModuleInfo } from '@/lib/progress'

let counter = 0
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

export function logActivity(d: DB, userId: string, type: ActivityType, text: string, at: string) {
  d.activities.push({ id: nextId('act'), userId, type, text, at })
}

export function notify(d: DB, userId: string, type: Notification['type'], title: string, body: string, at: string) {
  const s = d.settings.notifications
  const enabled = { enrollment: s.enrollment, payment: s.payment, course: s.courseUpdates, certificate: s.certificate }[type]
  if (!enabled) return
  d.notifications.push({ id: nextId('ntf'), userId, type, title, body, createdAt: at })
}

export function ensureProgress(d: DB, userId: string, lessonId: string, at: string): LessonProgress {
  let p = d.progress.find((x) => x.userId === userId && x.lessonId === lessonId)
  if (!p) {
    p = { userId, lessonId, resourcesViewed: [], videoPosition: 0, videoMaxPosition: 0, lastAccessedAt: at }
    d.progress.push(p)
  }
  p.lastAccessedAt = at
  return p
}

export function nextStudentNo(d: DB, at: string) {
  const year = new Date(at).getFullYear()
  const n = d.users.filter((u) => u.role === 'student').length + 1
  return `CIPM/${year}/${String(n).padStart(4, '0')}`
}

export function makePaymentReference(at: string, seq: number) {
  const dt = new Date(at)
  const ymd = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`
  return `CIPM-PAY-${ymd}-${String(10000 + ((seq * 7919) % 90000))}`
}

export function addMonthsIso(iso: string, months: number) {
  const dt = new Date(iso)
  dt.setMonth(dt.getMonth() + months)
  return dt.toISOString()
}

export function createPayment(
  d: DB,
  input: Pick<Payment, 'userId' | 'courseId' | 'intakeId' | 'amount' | 'method' | 'status'> & { cardLast4?: string; note?: string },
  at: string,
): Payment {
  const payment: Payment = {
    id: nextId('pay'),
    reference: makePaymentReference(at, d.payments.length + 1),
    date: at,
    ...input,
  }
  d.payments.push(payment)
  const course = d.courses.find((c) => c.id === input.courseId)
  logActivity(d, input.userId, 'payment', `Payment ${payment.reference} ${statusPhrase(input.status)} for ${course?.title ?? 'course'}`, at)
  if (input.status === 'success') createEnrollment(d, payment, at)
  return payment
}

function statusPhrase(s: PaymentStatus) {
  return { success: 'completed', pending: 'submitted and awaiting verification', failed: 'failed', refunded: 'refunded' }[s]
}

/** A successful payment always results in an enrollment. */
export function createEnrollment(d: DB, payment: Payment, at: string): Enrollment {
  const existing = d.enrollments.find((e) => e.userId === payment.userId && e.courseId === payment.courseId && e.status !== 'cancelled')
  if (existing) return existing
  const course = d.courses.find((c) => c.id === payment.courseId) as Course
  const intake = d.intakes.find((i) => i.id === payment.intakeId) as Intake
  const enrollment: Enrollment = {
    id: nextId('enr'),
    userId: payment.userId,
    courseId: payment.courseId,
    intakeId: payment.intakeId,
    paymentId: payment.id,
    status: 'active',
    enrolledAt: at,
    accessExpiresAt: addMonthsIso(at, d.settings.accessDurationMonths),
  }
  d.enrollments.push(enrollment)
  logActivity(d, payment.userId, 'enrolled', `Enrolled in ${course.title} (${intake?.name ?? 'intake'})`, at)
  notify(d, payment.userId, 'enrollment', 'Enrollment confirmed', `You are enrolled in ${course.title} for the ${intake?.name ?? 'selected intake'}. Your payment reference is ${payment.reference}.`, at)
  return enrollment
}

/** Admin changes a payment's status; enrollment follows the payment. */
export function applyPaymentStatus(d: DB, paymentId: string, status: PaymentStatus, at: string) {
  const payment = d.payments.find((p) => p.id === paymentId)
  if (!payment || payment.status === status) return
  payment.status = status
  if (status === 'success') {
    notify(d, payment.userId, 'payment', 'Payment verified', `Your payment ${payment.reference} has been verified.`, at)
    createEnrollment(d, payment, at)
  }
  if (status === 'refunded') {
    const enr = d.enrollments.find((e) => e.paymentId === payment.id && e.status !== 'cancelled')
    if (enr) enr.status = 'cancelled'
    notify(d, payment.userId, 'payment', 'Payment refunded', `Your payment ${payment.reference} has been refunded and the related enrollment was cancelled.`, at)
  }
  logActivity(d, payment.userId, 'payment', `Payment ${payment.reference} marked as ${status}`, at)
}

export function issueCertificate(d: DB, userId: string, courseId: string, at: string): Certificate {
  const existing = d.certificates.find((c) => c.userId === userId && c.courseId === courseId)
  if (existing) return existing
  const course = d.courses.find((c) => c.id === courseId)
  const seq = d.certificates.length + 1
  const cert: Certificate = {
    id: nextId('cert'),
    number: `${d.settings.certificate.numberPrefix}-${course?.code ?? 'CRS'}-${new Date(at).getFullYear()}-${String(1000 + seq * 37).padStart(6, '0')}`,
    userId,
    courseId,
    issuedAt: at,
  }
  d.certificates.push(cert)
  notify(d, userId, 'certificate', 'Your certificate is ready', `Congratulations! Your certificate for ${course?.title ?? 'the course'} (${cert.number}) is available under My Certificates.`, at)
  return cert
}

/** Course completion → mark enrollment complete and (optionally) issue the certificate. */
export function evaluateCourse(d: DB, userId: string, courseId: string, at: string) {
  const enr = getEnrollment(d, userId)
  if (!enr || enr.courseId !== courseId || enr.status !== 'active') return
  if (!getCourseStats(d, userId, courseId).complete) return
  const course = d.courses.find((c) => c.id === courseId)
  enr.status = 'completed'
  enr.completedAt = at
  logActivity(d, userId, 'course_completed', `Completed ${course?.title ?? 'the course'}`, at)
  if (d.settings.certificate.autoIssue) issueCertificate(d, userId, courseId, at)
}

/** Lesson completion → module completion → course completion. */
export function evaluateLesson(d: DB, userId: string, lessonId: string, at: string) {
  const lesson = d.lessons.find((l) => l.id === lessonId)
  if (!lesson) return
  const p = ensureProgress(d, userId, lessonId, at)
  if (p.completedAt) return
  const s = getLessonState(d, userId, lesson)
  if (!(s.materials && s.video && s.quiz)) return
  p.completedAt = at
  logActivity(d, userId, 'lesson_completed', `Completed lesson: ${lesson.title}`, at)
  const module = d.modules.find((m) => m.id === lesson.moduleId)
  if (!module) return
  if (getModuleInfo(d, userId, module).complete) {
    logActivity(d, userId, 'module_completed', `Completed module: ${module.title}`, at)
    notify(d, userId, 'course', 'Module completed', `Well done — you have completed "${module.title}".`, at)
  }
  evaluateCourse(d, userId, module.courseId, at)
}

export function recordAttempt(
  d: DB,
  input: { quiz: Quiz; lessonId: string; userId: string; answers: Record<string, string[]>; startedAt: string; submittedAt: string },
): QuizAttempt {
  const { quiz, lessonId, userId, answers, startedAt, submittedAt } = input
  const g = gradeQuiz(quiz, answers)
  const attempt: QuizAttempt = {
    id: nextId('att'),
    quizId: quiz.id,
    lessonId,
    userId,
    startedAt,
    submittedAt,
    durationSec: Math.max(1, Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000)),
    answers,
    ...g,
  }
  d.attempts.push(attempt)
  logActivity(d, userId, 'quiz_submitted', `Scored ${g.percent}% in ${quiz.title}`, submittedAt)
  // No pass mark: any submitted attempt counts as quiz completion.
  evaluateLesson(d, userId, lessonId, submittedAt)
  return attempt
}

/** After admin content changes, students may newly satisfy completion rules. */
export function recheckCompletions(d: DB, at: string) {
  for (const enr of d.enrollments) {
    if (enr.status === 'active') evaluateCourse(d, enr.userId, enr.courseId, at)
  }
}

export function newStudent(d: DB, input: Pick<User, 'name' | 'email' | 'phone' | 'password'>, at: string, verified = false): User {
  const user: User = {
    id: nextId('usr'),
    role: 'student',
    studentNo: nextStudentNo(d, at),
    status: 'active',
    emailVerified: verified,
    createdAt: at,
    ...input,
  }
  d.users.push(user)
  logActivity(d, user.id, 'registered', 'Created a student account', at)
  return user
}
