import { useMemo } from 'react'
import { useDB } from './db'
import { getCourseStats, getEnrollment } from '@/lib/progress'
import type { Course, Enrollment, Intake, Payment, User } from '@/types'

/** The signed-in user (null when signed out). */
export function useAuth() {
  const db = useDB()
  const user = db.users.find((u) => u.id === db.session.userId) ?? null
  return { db, user }
}

/** Everything the student portal needs about the signed-in student. */
export function useStudent() {
  const db = useDB()
  const user = db.users.find((u) => u.id === db.session.userId && u.role === 'student') as User
  return useMemo(() => {
    const enrollment: Enrollment | undefined = getEnrollment(db, user.id)
    const course: Course | undefined = db.courses.find((c) => c.id === (enrollment?.courseId ?? db.courses.find((x) => x.published)?.id))
    const intake: Intake | undefined = db.intakes.find((i) => i.id === enrollment?.intakeId)
    const payments: Payment[] = db.payments.filter((p) => p.userId === user.id).sort((a, b) => b.date.localeCompare(a.date))
    const stats = enrollment ? getCourseStats(db, user.id, enrollment.courseId) : undefined
    const certificate = db.certificates.find((c) => c.userId === user.id)
    return { db, user, enrollment, course, intake, payments, stats, certificate }
  }, [db, user])
}
