import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  Award, BarChart3, BookOpen, Bell, CalendarDays, ClipboardList, CreditCard, FileText, FolderOpen, GraduationCap, HelpCircle, Layers, LayoutDashboard, LineChart,
  ListChecks, Megaphone, Settings as SettingsIcon, UserCircle, Users, UserCheck,
} from 'lucide-react'
import { Shell, type NavItem } from '@/components/Shell'
import { RequireEnrollment, RequireRole } from '@/components/guards'
import { Button, EmptyState, PageLoader } from '@/components/ui'
import { useAuth } from '@/store/hooks'

const Landing = lazy(() => import('@/pages/public/Landing'))
const Login = lazy(() => import('@/pages/public/Login'))
const Register = lazy(() => import('@/pages/public/Register'))
const Forgot = lazy(() => import('@/pages/public/Forgot'))
const Verify = lazy(() => import('@/pages/public/Verify'))

const Dashboard = lazy(() => import('@/pages/student/Dashboard'))
const MyCourse = lazy(() => import('@/pages/student/MyCourse'))
const Learn = lazy(() => import('@/pages/student/Learn'))
const Materials = lazy(() => import('@/pages/student/Materials'))
const Progress = lazy(() => import('@/pages/student/Progress'))
const Certificates = lazy(() => import('@/pages/student/Certificates'))
const Announcements = lazy(() => import('@/pages/student/Announcements'))
const Payments = lazy(() => import('@/pages/student/Payments'))
const Profile = lazy(() => import('@/pages/student/Profile'))
const Help = lazy(() => import('@/pages/student/Help'))
const Enroll = lazy(() => import('@/pages/student/Enroll'))

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminCourses = lazy(() => import('@/pages/admin/Courses'))
const AdminModules = lazy(() => import('@/pages/admin/Modules'))
const AdminLessons = lazy(() => import('@/pages/admin/Lessons'))
const AdminQuizzes = lazy(() => import('@/pages/admin/Quizzes'))
const AdminStudents = lazy(() => import('@/pages/admin/Students'))
const AdminStudentDetail = lazy(() => import('@/pages/admin/StudentDetail'))
const AdminEnrollments = lazy(() => import('@/pages/admin/Enrollments'))
const AdminIntakes = lazy(() => import('@/pages/admin/Intakes'))
const AdminPayments = lazy(() => import('@/pages/admin/Payments'))
const AdminAnnouncements = lazy(() => import('@/pages/admin/Announcements'))
const AdminReports = lazy(() => import('@/pages/admin/Reports'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))

const studentNav: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/course', label: 'My Course', icon: GraduationCap },
  { to: '/app/materials', label: 'Learning Materials', icon: FolderOpen },
  { to: '/app/progress', label: 'My Progress', icon: LineChart },
  { to: '/app/certificates', label: 'My Certificates', icon: Award },
  { to: '/app/announcements', label: 'Announcements', icon: Bell },
  { to: '/app/payments', label: 'Payment History', icon: CreditCard },
  { to: '/app/profile', label: 'My Profile', icon: UserCircle },
  { to: '/app/help', label: 'Help & Support', icon: HelpCircle },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/modules', label: 'Modules', icon: Layers },
  { to: '/admin/lessons', label: 'Lessons', icon: FileText },
  { to: '/admin/quizzes', label: 'Quizzes', icon: ListChecks },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/enrollments', label: 'Enrollments', icon: UserCheck },
  { to: '/admin/intakes', label: 'Intakes', icon: CalendarDays },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

function NotFound() {
  const { user } = useAuth()
  const loc = useLocation()
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center">
      <EmptyState
        icon={ClipboardList} title="Page not found" description={`There is nothing at ${loc.pathname}.`}
        action={<Link to={user ? (user.role === 'admin' ? '/admin' : '/app') : '/'}><Button>Go to {user ? 'my dashboard' : 'home'}</Button></Link>}
      />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<Forgot />} />
        <Route path="/verify-email" element={<Verify />} />

        <Route element={<RequireRole role="student" />}>
          <Route path="/app/learn/:lessonId" element={<Learn />} />
          <Route element={<Shell nav={studentNav} area="student" subtitle="Student portal" />}>
            <Route path="/app/enroll" element={<Enroll />} />
            <Route path="/app/payments" element={<Payments />} />
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/app/help" element={<Help />} />
            <Route element={<RequireEnrollment />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/app/course" element={<MyCourse />} />
              <Route path="/app/materials" element={<Materials />} />
              <Route path="/app/progress" element={<Progress />} />
              <Route path="/app/certificates" element={<Certificates />} />
              <Route path="/app/announcements" element={<Announcements />} />
            </Route>
          </Route>
        </Route>

        <Route element={<RequireRole role="admin" />}>
          <Route element={<Shell nav={adminNav} area="admin" subtitle="Administration" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/modules" element={<AdminModules />} />
            <Route path="/admin/lessons" element={<AdminLessons />} />
            <Route path="/admin/quizzes" element={<AdminQuizzes />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
            <Route path="/admin/enrollments" element={<AdminEnrollments />} />
            <Route path="/admin/intakes" element={<AdminIntakes />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
