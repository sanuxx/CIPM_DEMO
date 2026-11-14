import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/hooks'
import { getEnrollment } from '@/lib/progress'

export function RequireRole({ role }: { role: 'student' | 'admin' }) {
  const { user } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />
  return <Outlet />
}

/** Course pages are only for enrolled students. Others are sent to enrollment. */
export function RequireEnrollment() {
  const { db, user } = useAuth()
  if (!user) return null
  const enr = getEnrollment(db, user.id)
  if (!enr || enr.status === 'suspended') return <Navigate to="/app/enroll" replace />
  return <Outlet />
}
