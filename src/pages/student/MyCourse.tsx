import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, Circle, Lock, PlayCircle, Unlock } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { getCourseModules, getLessonAccess, getLessonState, getModuleInfo, type ModuleInfo } from '@/lib/progress'
import { Badge, Card, EmptyState, PageHeader, ProgressBar } from '@/components/ui'
import { ModuleStatusBadge } from '@/components/common'
import { cn, formatDuration } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useAuth } from '@/store/hooks'

export function ModuleList({ infos, compact }: { infos: ModuleInfo[]; compact?: boolean }) {
  const db = useDB()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(compact ? null : (infos.find((i) => i.status === 'in_progress' || i.status === 'available')?.module.id ?? null))
  if (!user) return null
  return (
    <ul className="space-y-3">
      {infos.map((info) => {
        const m = info.module
        const locked = info.status === 'locked'
        const expanded = open === m.id && !compact
        return (
          <li key={m.id} className={cn('rounded-xl border border-line', locked ? 'bg-slate-50/70' : 'bg-white')}>
            <div className="flex items-center gap-3 p-4">
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold', locked ? 'bg-slate-200 text-slate-500' : info.complete ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-50 text-navy-800')}>
                {locked ? <Lock className="size-4" /> : info.complete ? <CheckCircle2 className="size-5" /> : m.order}
              </span>
              <button
                className="min-w-0 flex-1 text-left" disabled={compact}
                onClick={() => (locked ? toast.info('Module locked', { description: `Complete "${info.blockedBy?.title}" first.` }) : setOpen(expanded ? null : m.id))}
                aria-expanded={compact ? undefined : expanded}
              >
                <p className={cn('truncate font-medium', locked && 'text-slate-500')}>Module {m.order}: {m.title}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <ProgressBar value={info.percent} className="max-w-48" tone={info.complete ? 'green' : 'navy'} />
                  <span className="text-xs text-muted">{info.done}/{info.total} lessons</span>
                  <span className="hidden items-center gap-1 text-xs text-muted sm:inline-flex">{m.progression === 'sequential' ? <><Lock className="size-3" />Sequential</> : <><Unlock className="size-3" />Independent</>}</span>
                </div>
              </button>
              <ModuleStatusBadge status={info.status} />
              {!compact && <button aria-label={expanded ? 'Collapse module' : 'Expand module'} onClick={() => !locked && setOpen(expanded ? null : m.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} /></button>}
            </div>
            {expanded && (
              <div className="border-t border-line">
                <p className="px-4 pt-3 text-sm text-muted">{m.description}</p>
                <ul className="divide-y divide-line px-2 py-1">
                  {info.lessons.map((l) => {
                    const s = getLessonState(db, user.id, l)
                    const access = getLessonAccess(db, user.id, l)
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => (access.locked ? toast.info('Lesson locked', { description: access.reason }) : navigate(`/app/learn/${l.id}`))}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-50"
                        >
                          {s.completed ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : access.locked ? <Lock className="size-5 shrink-0 text-slate-400" /> : s.started ? <PlayCircle className="size-5 shrink-0 text-accent-600" /> : <Circle className="size-5 shrink-0 text-slate-300" />}
                          <span className="min-w-0 flex-1"><span className={cn('block text-sm font-medium', access.locked && 'text-slate-500')}>{l.order}. {l.title}</span><span className="block text-xs text-muted">{formatDuration(l.video.durationSec)} · {l.resources.length} materials · quiz</span></span>
                          {s.completed ? <Badge tone="green">Completed</Badge> : !access.locked && s.started && <Badge tone="amber">In progress</Badge>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function MyCourse() {
  const { db, user, course, stats } = useStudent()
  if (!course || !stats) return <EmptyState title="No course" />
  const infos = getCourseModules(db, course.id).map((m) => getModuleInfo(db, user.id, m))
  return (
    <>
      <PageHeader title="My course" description={course.title} actions={<Badge tone="navy">{stats.percent}% complete</Badge>} />
      <Card className="mb-6 p-5 text-sm leading-relaxed text-slate-700">
        <p><strong>How progression works:</strong> inside every lesson you complete <em>Materials → Video → Quiz</em> in that order. Modules 1–4 are sequential — each unlocks when the previous one is complete. Modules 5–8 are independent and available straight away, in any order. Any submitted quiz attempt counts as completion; there is no pass mark.</p>
      </Card>
      <ModuleList infos={infos} />
      {infos.length === 0 && <EmptyState title="No modules published" description="Course content will appear here once it is published." action={<Link to="/app">Back</Link>} />}
    </>
  )
}
