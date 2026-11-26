/**
 * All write operations of the demo backend. Every action persists to LocalStorage
 * through mutate() and is immediately visible in both portals.
 */
import type {
  Announcement, Course, DB, Enrollment, Intake, Lesson, Module, Payment, PaymentMethod, PaymentStatus, Quiz, QuizAttempt, Settings, User,
} from '@/types'
import { getDB, mutate, replaceDB } from './db'
import {
  applyPaymentStatus, createPayment, ensureProgress, evaluateLesson, issueCertificate, logActivity, newStudent, recheckCompletions, recordAttempt,
} from './logic'
import { createSeed } from '@/data/seed'
import { getLessonState } from '@/lib/progress'

const now = () => new Date().toISOString()
type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string }
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id)
  if (i >= 0) list[i] = item
  else list.push(item)
}

/* ───────────────────────────── Authentication ───────────────────────────── */

export function login(email: string, password: string): Result<User> {
  const user = getDB().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || user.password !== password) return fail('Incorrect email or password.')
  if (user.status !== 'active') return fail('This account has been deactivated. Please contact eArrow administration.')
  mutate((d) => {
    d.session.userId = user.id
    const u = d.users.find((x) => x.id === user.id) as User
    u.lastLoginAt = now()
    if (u.role === 'student') logActivity(d, u.id, 'login', 'Signed in to the learning portal', now())
  })
  return { ok: true, data: user }
}

export function logout() {
  mutate((d) => {
    d.session.userId = null
  })
}

export function registerStudent(input: Pick<User, 'name' | 'email' | 'phone' | 'password'>): Result<User> {
  const email = input.email.trim().toLowerCase()
  if (getDB().users.some((u) => u.email.toLowerCase() === email)) return fail('An account with this email already exists.')
  const user = mutate((d) => {
    const u = newStudent(d, { ...input, email }, now())
    d.session.userId = u.id
    return u
  })
  return { ok: true, data: user }
}

export function verifyEmail(userId: string) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId)
    if (u) u.emailVerified = true
  })
}

export function resetPassword(email: string, password: string): Result {
  const user = getDB().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) return fail('No account found for this email.')
  mutate((d) => {
    ;(d.users.find((u) => u.id === user.id) as User).password = password
  })
  return { ok: true, data: undefined }
}

export function changePassword(userId: string, current: string, next: string): Result {
  const user = getDB().users.find((u) => u.id === userId)
  if (!user || user.password !== current) return fail('Your current password is incorrect.')
  mutate((d) => {
    ;(d.users.find((u) => u.id === userId) as User).password = next
  })
  return { ok: true, data: undefined }
}

export function updateUser(userId: string, patch: Partial<User>): Result {
  const db = getDB()
  if (patch.email && db.users.some((u) => u.id !== userId && u.email.toLowerCase() === patch.email!.trim().toLowerCase())) {
    return fail('Another account already uses this email.')
  }
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId)
    if (u) Object.assign(u, patch)
  })
  return { ok: true, data: undefined }
}

/* ───────────────────────── Enrollment and payments ───────────────────────── */

export interface PaymentRequest {
  userId: string
  courseId: string
  intakeId: string
  method: PaymentMethod
  cardLast4?: string
  /** demo control: outcome the simulated gateway should return for card payments */
  simulate: 'success' | 'failed'
}

/** Simulated gateway. Card → success/failed, bank transfer → pending until an admin verifies it. */
export function processPayment(req: PaymentRequest): Payment {
  return mutate((d) => {
    const course = d.courses.find((c) => c.id === req.courseId) as Course
    const status: PaymentStatus = req.method === 'bank' ? 'pending' : req.simulate
    return createPayment(
      d,
      {
        userId: req.userId, courseId: req.courseId, intakeId: req.intakeId, amount: course.fee, method: req.method,
        cardLast4: req.cardLast4, status,
        note: status === 'failed' ? 'Card declined by issuing bank (simulated)' : status === 'pending' ? 'Bank transfer — awaiting verification by eArrow (simulated)' : undefined,
      },
      now(),
    )
  })
}

export function setPaymentStatus(paymentId: string, status: PaymentStatus) {
  mutate((d) => applyPaymentStatus(d, paymentId, status, now()))
}

export function updateEnrollment(id: string, patch: Partial<Enrollment>) {
  mutate((d) => {
    const e = d.enrollments.find((x) => x.id === id)
    if (!e) return
    Object.assign(e, patch)
    recheckCompletions(d, now())
  })
}

/* ─────────────────────────────── Learning ─────────────────────────────── */

export function touchLesson(userId: string, lessonId: string) {
  mutate((d) => {
    ensureProgress(d, userId, lessonId, now())
  })
}

export function markResourceViewed(userId: string, lessonId: string, resourceId: string) {
  mutate((d) => {
    const p = ensureProgress(d, userId, lessonId, now())
    if (!p.resourcesViewed.includes(resourceId)) p.resourcesViewed.push(resourceId)
  })
}

/** Step 1 — requires every learning material to have been opened. */
export function completeMaterials(userId: string, lessonId: string): Result {
  const lesson = getDB().lessons.find((l) => l.id === lessonId)
  if (!lesson) return fail('Lesson not found.')
  const viewed = getDB().progress.find((p) => p.userId === userId && p.lessonId === lessonId)?.resourcesViewed ?? []
  if (!lesson.resources.every((r) => viewed.includes(r.id))) return fail('Open every learning material before continuing.')
  mutate((d) => {
    const p = ensureProgress(d, userId, lessonId, now())
    if (!p.materialsDoneAt) p.materialsDoneAt = now()
    evaluateLesson(d, userId, lessonId, now())
  })
  return { ok: true, data: undefined }
}

export function saveVideoPosition(userId: string, lessonId: string, position: number) {
  mutate((d) => {
    const p = ensureProgress(d, userId, lessonId, now())
    p.videoPosition = position
    p.videoMaxPosition = Math.max(p.videoMaxPosition, position)
  })
}

/** Step 2 — only allowed once the materials step is done. */
export function completeVideo(userId: string, lessonId: string): Result {
  const db = getDB()
  const lesson = db.lessons.find((l) => l.id === lessonId)
  if (!lesson) return fail('Lesson not found.')
  if (!getLessonState(db, userId, lesson).materials) return fail('Complete the learning materials first.')
  mutate((d) => {
    const p = ensureProgress(d, userId, lessonId, now())
    if (!p.videoDoneAt) p.videoDoneAt = now()
    p.videoMaxPosition = Math.max(p.videoMaxPosition, lesson.video.durationSec)
    evaluateLesson(d, userId, lessonId, now())
  })
  return { ok: true, data: undefined }
}

/** Step 3 — only allowed after the video, and within the configured attempt limit. */
export function submitQuiz(input: {
  userId: string
  lessonId: string
  quizId: string
  answers: Record<string, string[]>
  startedAt: string
}): Result<QuizAttempt> {
  const db = getDB()
  const lesson = db.lessons.find((l) => l.id === input.lessonId)
  const quiz = db.quizzes.find((q) => q.id === input.quizId)
  if (!lesson || !quiz) return fail('Quiz not found.')
  const s = getLessonState(db, input.userId, lesson)
  if (!s.materials || !s.video) return fail('Complete the materials and video before taking the quiz.')
  const used = db.attempts.filter((a) => a.userId === input.userId && a.quizId === quiz.id).length
  if (used >= (quiz.maxAttempts ?? db.settings.maxQuizAttempts)) return fail('You have used all attempts for this quiz.')
  const attempt = mutate((d) =>
    recordAttempt(d, { quiz, lessonId: lesson.id, userId: input.userId, answers: input.answers, startedAt: input.startedAt, submittedAt: now() }),
  )
  return { ok: true, data: attempt }
}

export function markRead(userId: string, ids: string[]) {
  const read = getDB().reads[userId] ?? []
  const fresh = ids.filter((id) => !read.includes(id))
  if (!fresh.length) return
  mutate((d) => {
    d.reads[userId] = [...(d.reads[userId] ?? []), ...fresh]
  })
}

/* ─────────────────────────── Admin: content ─────────────────────────── */

export function saveCourse(course: Course) {
  mutate((d) => upsert(d.courses, course))
}

export function deleteCourse(courseId: string) {
  mutate((d) => {
    d.modules.filter((m) => m.courseId === courseId).forEach((m) => removeModule(d, m.id))
    d.courses = d.courses.filter((c) => c.id !== courseId)
    d.intakes = d.intakes.filter((i) => i.courseId !== courseId)
  })
}

export function saveModule(module: Module) {
  mutate((d) => {
    upsert(d.modules, module)
    recheckCompletions(d, now())
  })
}

function removeLesson(d: DB, lessonId: string) {
  const lesson = d.lessons.find((l) => l.id === lessonId)
  if (!lesson) return
  d.lessons = d.lessons.filter((l) => l.id !== lessonId)
  d.progress = d.progress.filter((p) => p.lessonId !== lessonId)
  lesson.quizIds.forEach((qid) => {
    if (!d.lessons.some((l) => l.quizIds.includes(qid))) {
      d.quizzes = d.quizzes.filter((q) => q.id !== qid)
      d.attempts = d.attempts.filter((a) => a.quizId !== qid)
    }
  })
}

function removeModule(d: DB, moduleId: string) {
  d.lessons.filter((l) => l.moduleId === moduleId).forEach((l) => removeLesson(d, l.id))
  d.modules = d.modules.filter((m) => m.id !== moduleId)
}

export function deleteModule(moduleId: string) {
  mutate((d) => {
    const mod = d.modules.find((m) => m.id === moduleId)
    removeModule(d, moduleId)
    if (mod) d.modules.filter((m) => m.courseId === mod.courseId).sort((a, b) => a.order - b.order).forEach((m, i) => (m.order = i + 1))
    recheckCompletions(d, now())
  })
}

/** orderedIds: every module id of the course in its new order */
export function reorderModules(orderedIds: string[]) {
  mutate((d) => {
    orderedIds.forEach((id, i) => {
      const m = d.modules.find((x) => x.id === id)
      if (m) m.order = i + 1
    })
  })
}

export function saveLesson(lesson: Lesson) {
  mutate((d) => {
    upsert(d.lessons, lesson)
    recheckCompletions(d, now())
  })
}

export function deleteLesson(lessonId: string) {
  mutate((d) => {
    const lesson = d.lessons.find((l) => l.id === lessonId)
    removeLesson(d, lessonId)
    if (lesson) d.lessons.filter((l) => l.moduleId === lesson.moduleId).sort((a, b) => a.order - b.order).forEach((l, i) => (l.order = i + 1))
    recheckCompletions(d, now())
  })
}

export function reorderLessons(orderedIds: string[]) {
  mutate((d) => {
    orderedIds.forEach((id, i) => {
      const l = d.lessons.find((x) => x.id === id)
      if (l) l.order = i + 1
    })
  })
}

/** Saves a quiz; pass lessonId to attach it to a lesson as an assessment activity. */
export function saveQuiz(quiz: Quiz, lessonId?: string) {
  mutate((d) => {
    upsert(d.quizzes, quiz)
    if (lessonId !== undefined) {
      d.lessons.forEach((l) => {
        const has = l.quizIds.includes(quiz.id)
        if (l.id === lessonId && !has) l.quizIds.push(quiz.id)
        if (l.id !== lessonId && has) l.quizIds = l.quizIds.filter((q) => q !== quiz.id)
      })
    }
  })
}

export function deleteQuiz(quizId: string) {
  mutate((d) => {
    d.quizzes = d.quizzes.filter((q) => q.id !== quizId)
    d.attempts = d.attempts.filter((a) => a.quizId !== quizId)
    d.lessons.forEach((l) => (l.quizIds = l.quizIds.filter((q) => q !== quizId)))
    recheckCompletions(d, now())
  })
}

/* ─────────────────────── Admin: operations ─────────────────────── */

export function saveIntake(intake: Intake) {
  mutate((d) => upsert(d.intakes, intake))
}

export function deleteIntake(intakeId: string): Result {
  if (getDB().enrollments.some((e) => e.intakeId === intakeId)) return fail('This intake has enrolled students and cannot be deleted.')
  mutate((d) => {
    d.intakes = d.intakes.filter((i) => i.id !== intakeId)
  })
  return { ok: true, data: undefined }
}

export function saveAnnouncement(a: Announcement) {
  mutate((d) => upsert(d.announcements, a))
}

export function deleteAnnouncement(id: string) {
  mutate((d) => {
    d.announcements = d.announcements.filter((a) => a.id !== id)
  })
}

export function updateSettings(settings: Settings) {
  mutate((d) => {
    d.settings = settings
  })
}

export function issueCertificateNow(userId: string, courseId: string) {
  return mutate((d) => issueCertificate(d, userId, courseId, now()))
}

/** Restores the original demo data. The signed-in user stays signed in if the account still exists. */
export function resetDemoData() {
  const current = getDB().users.find((u) => u.id === getDB().session.userId)
  const fresh = createSeed()
  const same = current && fresh.users.find((u) => u.email === current.email)
  fresh.session.userId = same ? same.id : null
  replaceDB(fresh)
}
