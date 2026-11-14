import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStudent } from '@/store/hooks'
import { getCourseModules, getModuleInfo, getAttempts, getCourseLessons } from '@/lib/progress'
import { Badge, Card, CardHeader, EmptyState, PageHeader, ProgressBar, StatCard } from '@/components/ui'
import { ModuleStatusBadge } from '@/components/common'
import { Award, BookOpenCheck, ClipboardCheck, Layers } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function Progress() {
  const { db, user, course, stats } = useStudent()
  const infos = useMemo(() => (course ? getCourseModules(db, course.id).map((m) => getModuleInfo(db, user.id, m)) : []), [db, course, user.id])
  const rows = useMemo(() => {
    if (!course) return []
    return getCourseLessons(db, course.id).flatMap((l) => l.quizIds.map((qid) => ({ lesson: l, quiz: db.quizzes.find((q) => q.id === qid), attempts: getAttempts(db, user.id, qid) })))
      .filter((r) => r.attempts.length > 0)
      .sort((a, b) => b.attempts[b.attempts.length - 1].submittedAt.localeCompare(a.attempts[a.attempts.length - 1].submittedAt))
  }, [db, course, user.id])
  if (!course || !stats) return null

  return (
    <>
      <PageHeader title="My progress" description="Module completion and quiz results." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall completion" value={`${stats.percent}%`} icon={BookOpenCheck} />
        <StatCard label="Modules" value={`${stats.modulesDone} / ${stats.modulesTotal}`} icon={Layers} tone="blue" />
        <StatCard label="Quizzes completed" value={`${stats.quizzesDone} / ${stats.quizzesTotal}`} icon={ClipboardCheck} tone="amber" />
        <StatCard label="Average score" value={stats.averageScore === null ? '—' : `${stats.averageScore}%`} icon={Award} tone="green" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Completion by module" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={infos.map((i) => ({ name: `M${i.module.order}`, completion: i.percent }))} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Completion']} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="completion" fill="#223f6c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Modules" />
          <ul className="divide-y divide-line">
            {infos.map((i) => (
              <li key={i.module.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{i.module.order}. {i.module.title}</p><ProgressBar value={i.percent} className="mt-1.5" tone={i.complete ? 'green' : 'navy'} /></div>
                <ModuleStatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Quiz results" description="Every submitted attempt is recorded." />
        {rows.length === 0 ? <EmptyState title="No quiz attempts yet" description="Complete a lesson quiz to see your results here." /> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Quiz</th><th className="px-5 py-3">Attempts</th><th className="px-5 py-3">Best</th><th className="px-5 py-3">Latest</th><th className="px-5 py-3">Last submitted</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ lesson, quiz, attempts }) => {
                const last = attempts[attempts.length - 1]
                return (
                  <tr key={quiz?.id}>
                    <td className="px-5 py-3 font-medium">{lesson.title}</td>
                    <td className="px-5 py-3">{attempts.length}</td>
                    <td className="px-5 py-3"><Badge tone="green">{Math.max(...attempts.map((a) => a.percent))}%</Badge></td>
                    <td className="px-5 py-3">{last.score}/{last.total} ({last.percent}%)</td>
                    <td className="px-5 py-3 text-muted">{formatDateTime(last.submittedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </Card>
    </>
  )
}
