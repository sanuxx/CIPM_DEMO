import type { DB, User } from '@/types'
import { getCourseStats, getEnrollment, getAttempts, getCourseModules, getModuleInfo, isIntakeOpen } from './progress'
import { lastMonths, monthKey, monthLabel } from './utils'

export const students = (db: DB) => db.users.filter((u) => u.role === 'student')

export function studentRow(db: DB, u: User) {
  const enr = getEnrollment(db, u.id)
  const intake = db.intakes.find((i) => i.id === enr?.intakeId)
  const payment = db.payments.filter((p) => p.userId === u.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  const stats = enr ? getCourseStats(db, u.id, enr.courseId) : undefined
  return { user: u, enrollment: enr, intake, payment, stats, course: db.courses.find((c) => c.id === enr?.courseId) }
}

export function dashboardStats(db: DB) {
  const st = students(db)
  const rows = st.map((u) => studentRow(db, u))
  const active = db.enrollments.filter((e) => e.status === 'active')
  const completed = db.enrollments.filter((e) => e.status === 'completed')
  const revenue = db.payments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0)
  const learning = rows.filter((r) => r.enrollment?.status === 'active' && (r.stats?.lessonsDone ?? 0) > 0).length
  const upcoming = db.intakes.filter((i) => new Date(i.date).getTime() >= Date.now())
  return { students: st.length, activeEnrollments: active.length, completed: completed.length, revenue, learning, upcomingIntakes: upcoming.length, openIntakes: upcoming.filter((i) => isIntakeOpen(db, i)).length, rows }
}

export function enrollmentTrend(db: DB, months = 8) {
  return lastMonths(months).map((k) => ({
    month: monthLabel(k),
    enrollments: db.enrollments.filter((e) => monthKey(e.enrolledAt) === k).length,
    registrations: students(db).filter((u) => monthKey(u.createdAt) === k).length,
  }))
}

export function revenueTrend(db: DB, months = 8) {
  return lastMonths(months).map((k) => ({
    month: monthLabel(k),
    revenue: db.payments.filter((p) => p.status === 'success' && monthKey(p.date) === k).reduce((s, p) => s + p.amount, 0),
  }))
}

export function completionBreakdown(db: DB) {
  let completed = 0, learning = 0, notStarted = 0
  for (const e of db.enrollments) {
    if (e.status === 'cancelled') continue
    const s = getCourseStats(db, e.userId, e.courseId)
    if (e.status === 'completed' || s.complete) completed++
    else if (s.lessonsDone > 0) learning++
    else notStarted++
  }
  return [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'In progress', value: learning, color: '#223f6c' },
    { name: 'Not started', value: notStarted, color: '#cbd5e1' },
  ]
}

export function activityTrend(db: DB, days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().slice(0, 10)
    const acts = db.activities.filter((a) => a.at.slice(0, 10) === key)
    return {
      day: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      activities: acts.length,
      learners: new Set(acts.map((a) => a.userId)).size,
    }
  })
}

export function moduleCompletion(db: DB, courseId: string) {
  const enrolled = db.enrollments.filter((e) => e.courseId === courseId && e.status !== 'cancelled')
  return getCourseModules(db, courseId).map((m) => {
    const done = enrolled.filter((e) => getModuleInfo(db, e.userId, m).complete).length
    const started = enrolled.filter((e) => getModuleInfo(db, e.userId, m).done > 0).length
    return { module: m, enrolled: enrolled.length, started, completed: done, rate: enrolled.length ? Math.round((done / enrolled.length) * 100) : 0 }
  })
}

export function quizPerformance(db: DB) {
  return db.quizzes.map((q) => {
    const lesson = db.lessons.find((l) => l.quizIds.includes(q.id))
    const module = db.modules.find((m) => m.id === lesson?.moduleId)
    const at = db.attempts.filter((a) => a.quizId === q.id)
    const users = new Set(at.map((a) => a.userId))
    const best = [...users].map((uid) => Math.max(...getAttempts(db, uid, q.id).map((a) => a.percent)))
    return {
      quiz: q, lesson, module, attempts: at.length, students: users.size,
      average: at.length ? Math.round(at.reduce((s, a) => s + a.percent, 0) / at.length) : null,
      bestAverage: best.length ? Math.round(best.reduce((s, v) => s + v, 0) / best.length) : null,
      highest: at.length ? Math.max(...at.map((a) => a.percent)) : null,
      lowest: at.length ? Math.min(...at.map((a) => a.percent)) : null,
    }
  })
}
