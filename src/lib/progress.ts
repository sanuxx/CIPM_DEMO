/**
 * Read-only selectors that implement the learning business rules.
 * Everything here is pure: (db, ids) → derived state.
 */
import type {
  Announcement, DB, Enrollment, Intake, Lesson, LessonProgress, Module, Notification, Quiz, QuizAttempt,
} from '@/types'

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed'
export type LessonStep = 'materials' | 'video' | 'quiz'

export function getCourseModules(db: DB, courseId: string, publishedOnly = true): Module[] {
  return db.modules
    .filter((m) => m.courseId === courseId && (!publishedOnly || m.published))
    .sort((a, b) => a.order - b.order)
}

export function getModuleLessons(db: DB, moduleId: string, publishedOnly = true): Lesson[] {
  return db.lessons
    .filter((l) => l.moduleId === moduleId && (!publishedOnly || l.published))
    .sort((a, b) => a.order - b.order)
}

export function getCourseLessons(db: DB, courseId: string, publishedOnly = true): Lesson[] {
  return getCourseModules(db, courseId, publishedOnly).flatMap((m) => getModuleLessons(db, m.id, publishedOnly))
}

export function getProgress(db: DB, userId: string, lessonId: string): LessonProgress | undefined {
  return db.progress.find((p) => p.userId === userId && p.lessonId === lessonId)
}

export function getLessonQuizzes(db: DB, lesson: Lesson): Quiz[] {
  return lesson.quizIds.map((id) => db.quizzes.find((q) => q.id === id)).filter((q): q is Quiz => !!q)
}

export function getAttempts(db: DB, userId: string, quizId: string): QuizAttempt[] {
  return db.attempts
    .filter((a) => a.userId === userId && a.quizId === quizId)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
}

export function maxAttemptsFor(db: DB, quiz: Quiz) {
  return quiz.maxAttempts ?? db.settings.maxQuizAttempts
}

export interface LessonState {
  materials: boolean
  video: boolean
  quiz: boolean
  completed: boolean
  /** the activity the student should do next, or null when all are done */
  current: LessonStep | null
  started: boolean
}

/** Materials → Video → Quiz. Any submitted attempt counts as quiz completion (no pass mark). */
export function getLessonState(db: DB, userId: string, lesson: Lesson): LessonState {
  const p = getProgress(db, userId, lesson.id)
  const completed = !!p?.completedAt
  const materials = completed || !!p?.materialsDoneAt || lesson.resources.length === 0
  const video = completed || !!p?.videoDoneAt
  const quizzes = getLessonQuizzes(db, lesson)
  const quiz = completed || quizzes.every((q) => db.attempts.some((a) => a.userId === userId && a.quizId === q.id))
  const current: LessonStep | null = !materials ? 'materials' : !video ? 'video' : !quiz ? 'quiz' : null
  return { materials, video, quiz, completed, current, started: !!p }
}

export function isLessonComplete(db: DB, userId: string, lessonId: string) {
  return !!getProgress(db, userId, lessonId)?.completedAt
}

export interface ModuleInfo {
  module: Module
  lessons: Lesson[]
  total: number
  done: number
  percent: number
  complete: boolean
  status: ModuleStatus
  /** set when locked */
  blockedBy?: Module
}

function moduleCounts(db: DB, userId: string, module: Module) {
  const lessons = getModuleLessons(db, module.id)
  const done = lessons.filter((l) => isLessonComplete(db, userId, l.id)).length
  // A module is complete when all of its required (published) lessons are completed.
  return { lessons, done, total: lessons.length, complete: lessons.length > 0 && done === lessons.length }
}

/**
 * Sequential modules unlock one after another: a sequential module is locked until every
 * earlier sequential module in the course is complete. Independent modules are never locked
 * and never block anything.
 */
export function getBlockingModule(db: DB, userId: string, module: Module): Module | undefined {
  if (module.progression !== 'sequential') return undefined
  return getCourseModules(db, module.courseId).find(
    (m) =>
      m.progression === 'sequential' &&
      m.order < module.order &&
      getModuleLessons(db, m.id).length > 0 &&
      !moduleCounts(db, userId, m).complete,
  )
}

export function getModuleInfo(db: DB, userId: string, module: Module): ModuleInfo {
  const { lessons, done, total, complete } = moduleCounts(db, userId, module)
  const blockedBy = getBlockingModule(db, userId, module)
  const started = lessons.some((l) => !!getProgress(db, userId, l.id))
  const status: ModuleStatus = complete ? 'completed' : blockedBy ? 'locked' : started ? 'in_progress' : 'available'
  return { module, lessons, total, done, percent: total ? Math.round((done / total) * 100) : 0, complete, status, blockedBy }
}

export interface LessonAccess {
  locked: boolean
  reason?: string
}

/** Within a module, lessons are taken in order. */
export function getLessonAccess(db: DB, userId: string, lesson: Lesson): LessonAccess {
  const module = db.modules.find((m) => m.id === lesson.moduleId)
  if (!module || !module.published || !lesson.published) return { locked: true, reason: 'This lesson is not available.' }
  if (isLessonComplete(db, userId, lesson.id)) return { locked: false }
  const blockedBy = getBlockingModule(db, userId, module)
  if (blockedBy) return { locked: true, reason: `Complete "${blockedBy.title}" to unlock this module.` }
  const lessons = getModuleLessons(db, module.id)
  const idx = lessons.findIndex((l) => l.id === lesson.id)
  const prev = lessons.slice(0, idx).find((l) => !isLessonComplete(db, userId, l.id))
  if (prev) return { locked: true, reason: `Complete "${prev.title}" first.` }
  return { locked: false }
}

export interface CourseStats {
  modulesTotal: number
  modulesDone: number
  lessonsTotal: number
  lessonsDone: number
  quizzesTotal: number
  quizzesDone: number
  averageScore: number | null
  percent: number
  complete: boolean
}

export function getCourseStats(db: DB, userId: string, courseId: string): CourseStats {
  const modules = getCourseModules(db, courseId).filter((m) => getModuleLessons(db, m.id).length > 0)
  let lessonsTotal = 0
  let lessonsDone = 0
  let modulesDone = 0
  const quizIds = new Set<string>()
  for (const m of modules) {
    const c = moduleCounts(db, userId, m)
    lessonsTotal += c.total
    lessonsDone += c.done
    if (c.complete) modulesDone++
    c.lessons.forEach((l) => getLessonQuizzes(db, l).forEach((q) => quizIds.add(q.id)))
  }
  const mine = db.attempts.filter((a) => a.userId === userId && quizIds.has(a.quizId))
  const best = new Map<string, number>()
  mine.forEach((a) => best.set(a.quizId, Math.max(best.get(a.quizId) ?? 0, a.percent)))
  const scores = [...best.values()]
  return {
    modulesTotal: modules.length,
    modulesDone,
    lessonsTotal,
    lessonsDone,
    quizzesTotal: quizIds.size,
    quizzesDone: best.size,
    averageScore: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
    percent: lessonsTotal ? Math.round((lessonsDone / lessonsTotal) * 100) : 0,
    complete: modules.length > 0 && modulesDone === modules.length,
  }
}

/** The student's current enrollment (latest that is not cancelled). */
export function getEnrollment(db: DB, userId: string): Enrollment | undefined {
  return db.enrollments
    .filter((e) => e.userId === userId && e.status !== 'cancelled')
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))[0]
}

export function getIntakeEnrolledCount(db: DB, intakeId: string) {
  return db.enrollments.filter((e) => e.intakeId === intakeId && e.status !== 'cancelled').length
}

export function isIntakeOpen(db: DB, intake: Intake, now = new Date()) {
  return (
    intake.status === 'open' &&
    new Date(intake.registrationDeadline).getTime() >= now.getTime() &&
    getIntakeEnrolledCount(db, intake.id) < intake.capacity
  )
}

export function getOpenIntakes(db: DB, courseId: string): Intake[] {
  return db.intakes
    .filter((i) => i.courseId === courseId && isIntakeOpen(db, i))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Lesson to resume: most recently accessed unfinished lesson, else the first unlocked unfinished one. */
export function getContinueLesson(db: DB, userId: string, courseId: string): Lesson | undefined {
  const lessons = getCourseLessons(db, courseId)
  const open = lessons.filter((l) => !isLessonComplete(db, userId, l.id) && !getLessonAccess(db, userId, l).locked)
  const recent = open
    .map((l) => ({ l, p: getProgress(db, userId, l.id) }))
    .filter((x) => x.p)
    .sort((a, b) => (b.p as LessonProgress).lastAccessedAt.localeCompare((a.p as LessonProgress).lastAccessedAt))[0]
  return recent?.l ?? open[0]
}

export type FeedItem =
  | { kind: 'announcement'; id: string; title: string; body: string; at: string; category: Announcement['category'] }
  | { kind: 'notification'; id: string; title: string; body: string; at: string; category: Notification['type'] }

export function getAnnouncementsFor(db: DB, userId: string): Announcement[] {
  const intakeId = getEnrollment(db, userId)?.intakeId
  return db.announcements
    .filter((a) => a.published && (a.audience === 'all' || (!!intakeId && a.intakeIds.includes(intakeId))))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Announcements + personal notifications, newest first. */
export function getFeed(db: DB, userId: string): FeedItem[] {
  const items: FeedItem[] = [
    ...getAnnouncementsFor(db, userId).map(
      (a): FeedItem => ({ kind: 'announcement', id: a.id, title: a.title, body: a.body, at: a.createdAt, category: a.category }),
    ),
    ...db.notifications
      .filter((n) => n.userId === userId)
      .map((n): FeedItem => ({ kind: 'notification', id: n.id, title: n.title, body: n.body, at: n.createdAt, category: n.type })),
  ]
  return items.sort((a, b) => b.at.localeCompare(a.at))
}

export function getUnreadCount(db: DB, userId: string) {
  const read = new Set(db.reads[userId] ?? [])
  return getFeed(db, userId).filter((f) => !read.has(f.id)).length
}
