import { Link } from 'react-router-dom'
import { Award, BookOpenCheck, CheckCircle2, ClipboardCheck, Layers, Megaphone, PlayCircle, Trophy, Activity as ActivityIcon, Lock } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { getContinueLesson, getCourseModules, getFeed, getLessonState, getModuleInfo } from '@/lib/progress'
import { Badge, Button, Card, CardHeader, EmptyState, ProgressBar, StatCard } from '@/components/ui'
import { CoverArt } from '@/components/common'
import { formatDate, formatDuration, formatLongDate, timeAgo } from '@/lib/utils'
import { ModuleList } from './MyCourse'

const ACTIVITY_ICON = { lesson_completed: CheckCircle2, quiz_submitted: ClipboardCheck, module_completed: Layers, course_completed: Trophy } as const

export default function Dashboard() {
  const { db, user, course, enrollment, intake, stats, certificate } = useStudent()
  if (!course || !enrollment || !stats) return null
  const modules = getCourseModules(db, course.id).map((m) => getModuleInfo(db, user.id, m))
  const cont = getContinueLesson(db, user.id, course.id)
  const contModule = cont ? db.modules.find((m) => m.id === cont.moduleId) : undefined
  const contState = cont ? getLessonState(db, user.id, cont) : undefined
  const contSteps = contState ? [contState.materials, contState.video, contState.quiz].filter(Boolean).length : 0
  const activities = db.activities.filter((a) => a.userId === user.id && a.type !== 'login' && a.type !== 'registered').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)
  const feed = getFeed(db, user.id).slice(0, 4)
  const read = new Set(db.reads[user.id] ?? [])

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy-50 via-white to-sky-50 ring-1 ring-line">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{user.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{course.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-white text-slate-600 ring-1 ring-line">{intake?.name ?? 'Intake'}</Badge>
              <Badge className="bg-white text-slate-600 ring-1 ring-line">Access until {formatDate(enrollment.accessExpiresAt)}</Badge>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">Course progress</span><span className="font-semibold text-ink">{stats.percent}%</span></div>
            <ProgressBar value={stats.percent} />
          </div>
        </div>
      </Card>

      {stats.complete && (
        <Card className="flex flex-col gap-3 border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><Trophy className="size-8 text-emerald-600" /><div><p className="font-semibold text-emerald-900">Course completed — congratulations!</p><p className="text-sm text-emerald-800">{certificate ? `Certificate ${certificate.number} issued on ${formatLongDate(certificate.issuedAt)}.` : 'Your certificate is being prepared.'}</p></div></div>
          <Link to="/app/certificates"><Button>View certificate</Button></Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Modules completed" value={`${stats.modulesDone} / ${stats.modulesTotal}`} icon={Layers} />
        <StatCard label="Lessons completed" value={`${stats.lessonsDone} / ${stats.lessonsTotal}`} icon={BookOpenCheck} tone="blue" />
        <StatCard label="Quizzes completed" value={`${stats.quizzesDone} / ${stats.quizzesTotal}`} icon={ClipboardCheck} tone="amber" />
        <StatCard label="Average quiz score" value={stats.averageScore === null ? '—' : `${stats.averageScore}%`} icon={Award} tone="green" hint="Best attempt per quiz" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Continue learning" />
            {cont && contModule ? (
              <div className="flex flex-col gap-5 p-5 sm:flex-row">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:w-60">
                  <CoverArt seed={cont.id} label={cont.title} />
                  <span className="absolute inset-0 flex items-center justify-center"><PlayCircle className="size-12 text-white/90 drop-shadow" /></span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Module {contModule.order} · Lesson {cont.order}</p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug">{cont.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{cont.summary}</p>
                  <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-muted"><span>{contSteps} of 3 steps done</span><span>{formatDuration(cont.video.durationSec)} video</span></div><ProgressBar value={(contSteps / 3) * 100} /></div>
                  <div className="mt-auto pt-4"><Link to={`/app/learn/${cont.id}`}><Button>{contState?.started ? 'Continue lesson' : 'Start lesson'}</Button></Link></div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Trophy} title={stats.complete ? 'You have finished every lesson' : 'No lesson available'} description={stats.complete ? 'Revisit any lesson from My Course.' : 'Complete earlier modules to unlock more lessons.'} />
            )}
          </Card>

          <Card>
            <CardHeader title="My course" description="Modules 1–4 unlock in order. Modules 5–8 are open from day one." action={<Link to="/app/course"><Button variant="ghost" size="sm">View all</Button></Link>} />
            <div className="p-5"><ModuleList infos={modules} compact /></div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Notifications" action={<Link to="/app/announcements"><Button variant="ghost" size="sm">All</Button></Link>} />
            <ul className="divide-y divide-line">
              {feed.map((f) => (
                <li key={f.id} className="flex gap-3 px-5 py-3.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700"><Megaphone className="size-4" /></span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">{f.title}{!read.has(f.id) && <span className="size-2 rounded-full bg-accent-500" aria-label="Unread" />}</p>
                    <p className="line-clamp-2 text-xs text-muted">{f.body}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(f.at)}</p>
                  </div>
                </li>
              ))}
              {feed.length === 0 && <li><EmptyState title="No notifications" description="New announcements will appear here." /></li>}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            <ul className="divide-y divide-line">
              {activities.map((a) => {
                const Icon = ACTIVITY_ICON[a.type as keyof typeof ACTIVITY_ICON] ?? ActivityIcon
                return (
                  <li key={a.id} className="flex gap-3 px-5 py-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-navy-600" />
                    <div className="min-w-0"><p className="text-sm">{a.text}</p><p className="text-[11px] text-slate-400">{timeAgo(a.at)}</p></div>
                  </li>
                )
              })}
              {activities.length === 0 && <li><EmptyState icon={Lock} title="No activity yet" description="Start your first lesson to see progress here." /></li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
