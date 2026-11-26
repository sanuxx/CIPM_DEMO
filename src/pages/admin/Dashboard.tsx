import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpenCheck, CalendarDays, GraduationCap, Trophy, UserCheck, Users, Wallet } from 'lucide-react'
import { useDB } from '@/store/db'
import { activityTrend, completionBreakdown, dashboardStats, enrollmentTrend, revenueTrend, students } from '@/lib/analytics'
import { Avatar, Button, Card, CardHeader, EmptyState, PageHeader, StatCard } from '@/components/ui'
import { PaymentBadge } from '@/components/common'
import { formatCompactLKR, formatDate, formatLKR, timeAgo } from '@/lib/utils'

const AXIS = { fontSize: 12, tickLine: false, axisLine: false } as const

export default function AdminDashboard() {
  const db = useDB()
  const s = dashboardStats(db)
  const recentPayments = [...db.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const recentRegs = [...students(db)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
  const completion = completionBreakdown(db)

  return (
    <>
      <PageHeader title="Dashboard" description="A live overview of the eArrow learning portal. Charts update as demo data changes." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total students" value={s.students} icon={Users} />
        <StatCard label="Active enrollments" value={s.activeEnrollments} icon={UserCheck} tone="blue" />
        <StatCard label="Total revenue" value={formatCompactLKR(s.revenue)} icon={Wallet} tone="green" hint={formatLKR(s.revenue)} />
        <StatCard label="Upcoming intakes" value={s.upcomingIntakes} icon={CalendarDays} tone="amber" hint={`${s.openIntakes} open for registration`} />
        <StatCard label="Completed courses" value={s.completed} icon={Trophy} tone="purple" />
        <StatCard label="Students currently learning" value={s.learning} icon={BookOpenCheck} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Enrollment trends" description="Registrations and enrollments per month" />
          <div className="h-72 p-4"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={enrollmentTrend(db)} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" {...AXIS} /><YAxis allowDecimals={false} {...AXIS} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} /><Legend iconType="circle" />
              <Bar dataKey="registrations" name="Registrations" fill="#8aaad6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="enrollments" name="Enrollments" fill="#223f6c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader title="Revenue trends" description="Successful payments per month (LKR)" />
          <div className="h-72 p-4"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend(db)} margin={{ left: 0 }}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#223f6c" stopOpacity={0.25} /><stop offset="100%" stopColor="#223f6c" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" {...AXIS} /><YAxis tickFormatter={(v: number) => formatCompactLKR(v).replace('LKR ', '')} {...AXIS} />
              <Tooltip formatter={(v) => [formatLKR(Number(v)), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#223f6c" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader title="Course completion" description="Enrolled students by learning status" />
          <div className="flex h-72 items-center p-4"><ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={completion} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {completion.map((c) => <Cell key={c.name} fill={c.color} />)}
              </Pie>
              <Tooltip /><Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader title="Student activity" description="Learning events and active learners, last 14 days" />
          <div className="h-72 p-4"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityTrend(db)} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" interval={1} {...AXIS} /><YAxis allowDecimals={false} {...AXIS} />
              <Tooltip /><Legend iconType="circle" />
              <Line type="monotone" dataKey="activities" name="Events" stroke="#223f6c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="learners" name="Active learners" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent payments" action={<Link to="/admin/payments"><Button variant="ghost" size="sm">View all</Button></Link>} />
          <ul className="divide-y divide-line">
            {recentPayments.map((p) => {
              const u = db.users.find((x) => x.id === p.userId)
              return (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={u?.name ?? '?'} photo={u?.photo} size={32} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{u?.name}</p><p className="text-xs text-muted">{p.reference} · {timeAgo(p.date)}</p></div>
                  <span className="text-sm">{formatLKR(p.amount)}</span><PaymentBadge status={p.status} />
                </li>
              )
            })}
            {recentPayments.length === 0 && <li><EmptyState title="No payments yet" /></li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Recent registrations" action={<Link to="/admin/students"><Button variant="ghost" size="sm">View all</Button></Link>} />
          <ul className="divide-y divide-line">
            {recentRegs.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={u.name} photo={u.photo} size={32} />
                <div className="min-w-0 flex-1"><Link to={`/admin/students/${u.id}`} className="truncate text-sm font-medium hover:underline">{u.name}</Link><p className="truncate text-xs text-muted">{u.email}</p></div>
                <span className="text-xs text-muted">{formatDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-muted"><GraduationCap className="size-4" />All figures are generated from fictional demo data.</p>
    </>
  )
}
