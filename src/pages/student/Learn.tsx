import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Circle, ClipboardList, Eye, FileText, Info, Lock, Menu, PlayCircle, Video, X, Download } from 'lucide-react'
import { useDB } from '@/store/db'
import { useAuth } from '@/store/hooks'
import {
  getCourseLessons, getCourseModules, getEnrollment, getLessonAccess, getLessonQuizzes, getLessonState, getModuleInfo, getProgress, type LessonStep,
} from '@/lib/progress'
import { completeMaterials, completeVideo, markResourceViewed, saveVideoPosition, touchLesson } from '@/store/actions'
import { Badge, Button, Card, EmptyState, ProgressBar } from '@/components/ui'
import { Logo, ResourceIcon, ResourceViewer, RichText, downloadResource, resourceMeta } from '@/components/common'
import { VideoPlayer } from '@/components/VideoPlayer'
import { QuizRunner } from '@/components/QuizRunner'
import { cn, formatDuration } from '@/lib/utils'
import type { Resource } from '@/types'

const STEPS: { id: LessonStep; label: string; icon: typeof FileText }[] = [
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'quiz', label: 'Quiz', icon: ClipboardList },
]

export default function Learn() {
  const { lessonId = '' } = useParams()
  const db = useDB()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<LessonStep>('materials')
  const [viewing, setViewing] = useState<Resource | null>(null)
  const [drawer, setDrawer] = useState(false)
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})

  const lesson = db.lessons.find((l) => l.id === lessonId)
  const module = lesson ? db.modules.find((m) => m.id === lesson.moduleId) : undefined
  const enrollment = user ? getEnrollment(db, user.id) : undefined
  const course = module ? db.courses.find((c) => c.id === module.courseId) : undefined

  const state = lesson && user ? getLessonState(db, user.id, lesson) : undefined
  const access = lesson && user ? getLessonAccess(db, user.id, lesson) : { locked: true }
  const progress = lesson && user ? getProgress(db, user.id, lesson.id) : undefined
  const quizzes = lesson ? getLessonQuizzes(db, lesson) : []

  // choose the step to show when the lesson changes
  const started = useRef<string>('')
  useEffect(() => {
    if (!lesson || !user || !state || access.locked || started.current === lesson.id) return
    started.current = lesson.id
    touchLesson(user.id, lesson.id)
    setStep(state.current ?? 'materials')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, access.locked])

  // announce completion once
  const wasDone = useRef<boolean | null>(null)
  useEffect(() => {
    if (!state || !lesson) return
    if (wasDone.current === false && state.completed) {
      toast.success('Lesson completed 🎉', { description: lesson.title })
      if (module && user && getModuleInfo(db, user.id, module).complete) toast.success(`Module ${module.order} complete`, { description: module.title })
    }
    wasDone.current = state.completed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.completed, lesson?.id])
  useEffect(() => { wasDone.current = null }, [lesson?.id])

  useEffect(() => {
    if (module) setOpenModules((o) => ({ ...o, [module.id]: true }))
  }, [module?.id])

  const nav = useMemo(() => {
    if (!course) return { prev: undefined, next: undefined }
    const all = getCourseLessons(db, course.id)
    const i = all.findIndex((l) => l.id === lessonId)
    return { prev: all[i - 1], next: all[i + 1] }
  }, [db, course, lessonId])

  if (!user || !enrollment) return <Navigate to="/app/enroll" replace />
  if (enrollment.status === 'suspended') return <Navigate to="/app/enroll" replace />
  if (!lesson || !module || !course || !state) {
    return <div className="grid min-h-screen place-items-center"><EmptyState title="Lesson not found" description="This lesson no longer exists." action={<Link to="/app/course"><Button>Back to my course</Button></Link>} /></div>
  }

  const modules = getCourseModules(db, course.id).map((m) => getModuleInfo(db, user.id, m))
  const stepDone = { materials: state.materials, video: state.video, quiz: state.quiz }
  const stepUnlocked = (s: LessonStep) => s === 'materials' || (s === 'video' ? state.materials : state.materials && state.video)
  const viewed = progress?.resourcesViewed ?? []
  const allViewed = lesson.resources.every((r) => viewed.includes(r.id))
  const startAt = progress && !state.completed && progress.videoPosition < lesson.video.durationSec - 3 ? progress.videoPosition : 0
  const s = db.settings.video

  const openResource = (r: Resource) => setViewing(r)
  const finishMaterials = () => {
    const res = completeMaterials(user.id, lesson.id)
    if (!res.ok) return toast.error(res.error)
    toast.success('Materials complete', { description: 'The lecture video is now unlocked.' })
    setStep('video')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Course content</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold">{course.title}</p>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto p-2">
        {modules.map((info) => {
          const open = openModules[info.module.id]
          const locked = info.status === 'locked'
          return (
            <div key={info.module.id} className="mb-1">
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left hover:bg-slate-50" onClick={() => setOpenModules((o) => ({ ...o, [info.module.id]: !open }))} aria-expanded={!!open}>
                {locked ? <Lock className="size-4 shrink-0 text-slate-400" /> : info.complete ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[10px] font-bold text-navy-800">{info.module.order}</span>}
                <span className={cn('min-w-0 flex-1 text-sm font-medium leading-snug', locked && 'text-slate-500')}>{info.module.title}</span>
                <span className="text-[11px] text-muted">{info.done}/{info.total}</span>
                <ChevronDown className={cn('size-4 text-slate-400 transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <ul className="ml-3 border-l border-line pl-2">
                  {info.lessons.map((l) => {
                    const ls = getLessonState(db, user.id, l)
                    const a = getLessonAccess(db, user.id, l)
                    const active = l.id === lesson.id
                    return (
                      <li key={l.id}>
                        <button
                          onClick={() => { if (a.locked) toast.info('Lesson locked', { description: a.reason }); else { navigate(`/app/learn/${l.id}`); setDrawer(false) } }}
                          className={cn('flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm', active ? 'bg-navy-50 font-medium text-navy-900' : 'hover:bg-slate-50', a.locked && 'text-slate-400')}
                          aria-current={active ? 'page' : undefined}
                        >
                          {ls.completed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : a.locked ? <Lock className="mt-0.5 size-4 shrink-0" /> : ls.started ? <PlayCircle className="mt-0.5 size-4 shrink-0 text-accent-600" /> : <Circle className="mt-0.5 size-4 shrink-0 text-slate-300" />}
                          <span className="min-w-0 flex-1 leading-snug">{l.order}. {l.title}<span className="block text-[11px] font-normal text-muted">{formatDuration(l.video.durationSec)}</span></span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-3 sm:px-5">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setDrawer(true)} aria-label="Open course content"><Menu className="size-5" /></Button>
        <Link to="/app/course" className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink sm:flex"><ArrowLeft className="size-4" />My course</Link>
        <div className="mx-2 hidden h-5 w-px bg-line sm:block" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">Module {module.order} · {lesson.title}</p>
        <Logo className="hidden md:flex" />
      </header>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[90vw] bg-white shadow-pop">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setDrawer(false)} aria-label="Close"><X className="size-4" /></Button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_19rem]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] border-r border-line bg-white lg:block">{sidebar}</aside>

        <main className="min-w-0 p-4 sm:p-6">
          {access.locked ? (
            <Card><EmptyState icon={Lock} title="This lesson is locked" description={access.reason} action={<Link to="/app/course"><Button>Back to my course</Button></Link>} /></Card>
          ) : (
            <>
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={module.progression === 'sequential' ? 'amber' : 'green'}>{module.progression === 'sequential' ? 'Sequential module' : 'Independent module'}</Badge>
                  {state.completed && <Badge tone="green"><CheckCircle2 className="size-3" />Lesson completed</Badge>}
                </div>
                <h1 className="mt-2 text-2xl font-semibold">{lesson.title}</h1>
                <p className="mt-1 text-sm text-muted">{lesson.summary}</p>
              </div>

              <ol className="mb-5 grid grid-cols-3 gap-2" aria-label="Lesson steps">
                {STEPS.map((st, i) => {
                  const unlocked = stepUnlocked(st.id)
                  const done = stepDone[st.id]
                  return (
                    <li key={st.id}>
                      <button
                        disabled={!unlocked}
                        onClick={() => setStep(st.id)}
                        aria-current={step === st.id ? 'step' : undefined}
                        className={cn('flex w-full items-center gap-2.5 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed', step === st.id ? 'border-navy-600 bg-white ring-2 ring-navy-200' : 'border-line bg-white hover:border-navy-300 disabled:bg-slate-50 disabled:hover:border-line')}
                      >
                        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', done ? 'bg-emerald-50 text-emerald-600' : unlocked ? 'bg-navy-50 text-navy-700' : 'bg-slate-100 text-slate-400')}>
                          {done ? <CheckCircle2 className="size-4" /> : unlocked ? <st.icon className="size-4" /> : <Lock className="size-4" />}
                        </span>
                        <span className="min-w-0"><span className="block text-[11px] text-muted">Step {i + 1}</span><span className={cn('block truncate text-sm font-medium', !unlocked && 'text-slate-400')}>{st.label}</span></span>
                      </button>
                    </li>
                  )
                })}
              </ol>

              {step === 'materials' && (
                <div className="space-y-5">
                  <Card>
                    <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Learning materials</h2><p className="text-sm text-muted">Open every item to unlock the video. {viewed.filter((id) => lesson.resources.some((r) => r.id === id)).length} of {lesson.resources.length} opened.</p></div>
                    <ul className="divide-y divide-line">
                      {lesson.resources.map((r) => {
                        const seen = viewed.includes(r.id)
                        return (
                          <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                            <ResourceIcon type={r.type} />
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="text-xs text-muted">{resourceMeta(r)}</p></div>
                            {seen && <Badge tone="green"><CheckCircle2 className="size-3" />Opened</Badge>}
                            <Button size="sm" variant="outline" onClick={() => openResource(r)}><Eye className="size-3.5" />{r.type === 'link' ? 'Open' : 'Preview'}</Button>
                            {r.downloadable && <Button size="sm" variant="ghost" onClick={() => { downloadResource(r); markResourceViewed(user.id, lesson.id, r.id) }} aria-label={`Download ${r.name}`}><Download className="size-3.5" /></Button>}
                          </li>
                        )
                      })}
                      {lesson.resources.length === 0 && <li><EmptyState title="No materials" description="This lesson has no learning materials." /></li>}
                    </ul>
                  </Card>
                  <Card className="p-5 sm:p-6">
                    <h2 className="mb-3 font-semibold">Lesson notes</h2>
                    <RichText body={lesson.content || lesson.summary} />
                  </Card>
                  <div className="flex items-center justify-end gap-3">
                    {state.materials ? <Button onClick={() => setStep('video')}>Continue to video<ArrowRight className="size-4" /></Button>
                      : <Button disabled={!allViewed} onClick={finishMaterials}>{allViewed ? 'Mark materials complete & continue' : 'Open all materials to continue'}</Button>}
                  </div>
                </div>
              )}

              {step === 'video' && stepUnlocked('video') && (
                <div className="space-y-4">
                  <VideoPlayer
                    key={lesson.id} lesson={lesson} startAt={startAt} maxPosition={progress?.videoMaxPosition ?? 0}
                    watermark={s.watermark ? `${user.name} · ${user.studentNo ?? user.email}` : undefined}
                    allowSpeed={s.allowSpeedControl} restrictForwardSeek={s.restrictForwardSeek} protect={s.protectedPlayback !== false} requiredPercent={s.requiredWatchPercent}
                    completed={state.video}
                    onPosition={(p) => saveVideoPosition(user.id, lesson.id, p)}
                    onComplete={() => { const r = completeVideo(user.id, lesson.id); if (r.ok) toast.success('Video completed', { description: 'The quiz is now unlocked.' }) }}
                  />
                  <p className="flex items-start gap-2 text-xs text-muted"><Info className="mt-0.5 size-3.5 shrink-0" />This video is protected: it is tied to your account and watermarked with your name and ID. Downloading, sharing the link and screen capture are not permitted, and any copy can be traced to you. {startAt > 0 && `Resuming from ${formatDuration(startAt)}.`}</p>
                  <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={() => setStep('materials')}><ArrowLeft className="size-4" />Materials</Button>
                    {state.video ? <Button onClick={() => setStep('quiz')}>Continue to quiz<ArrowRight className="size-4" /></Button> : <span className="text-sm text-muted">Watch at least {s.requiredWatchPercent}% to unlock the quiz.</span>}
                  </div>
                </div>
              )}

              {step === 'quiz' && stepUnlocked('quiz') && (
                <div className="space-y-8">
                  {quizzes.map((q) => <QuizRunner key={q.id} quiz={q} lessonId={lesson.id} userId={user.id} />)}
                  {quizzes.length === 0 && <Card><EmptyState title="No quiz" description="This lesson has no assessment." /></Card>}
                </div>
              )}

              {state.completed && (
                <Card className="mt-6 flex flex-col gap-3 border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3"><CheckCircle2 className="size-6 text-emerald-600" /><div><p className="font-semibold text-emerald-900">Lesson completed</p><p className="text-sm text-emerald-800">Materials, video and quiz are all done.</p></div></div>
                  {nav.next && !getLessonAccess(db, user.id, nav.next).locked
                    ? <Button onClick={() => navigate(`/app/learn/${nav.next!.id}`)}>Next lesson<ArrowRight className="size-4" /></Button>
                    : <Link to="/app/course"><Button>Back to my course</Button></Link>}
                </Card>
              )}

              <div className="mt-6 flex justify-between border-t border-line pt-4 text-sm">
                {nav.prev ? <Button variant="ghost" onClick={() => navigate(`/app/learn/${nav.prev!.id}`)}><ArrowLeft className="size-4" />Previous lesson</Button> : <span />}
                {nav.next && <Button variant="ghost" disabled={getLessonAccess(db, user.id, nav.next).locked} onClick={() => navigate(`/app/learn/${nav.next!.id}`)}>Next lesson<ArrowRight className="size-4" /></Button>}
              </div>
            </>
          )}
        </main>

        <aside className="hidden space-y-4 border-l border-line bg-white p-5 xl:block">
          <h2 className="text-sm font-semibold">Lesson information</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-muted">Module</dt><dd className="font-medium">{module.order}. {module.title}</dd></div>
            <div><dt className="text-xs text-muted">Video length</dt><dd className="font-medium">{formatDuration(lesson.video.durationSec)}</dd></div>
            <div><dt className="text-xs text-muted">Quiz attempts</dt><dd className="font-medium">{quizzes.map((q) => `${db.attempts.filter((a) => a.userId === user.id && a.quizId === q.id).length} / ${q.maxAttempts ?? db.settings.maxQuizAttempts}`).join(', ') || '—'}</dd></div>
          </dl>
          <div>
            <p className="mb-2 text-xs text-muted">Lesson progress</p>
            <ProgressBar value={([state.materials, state.video, state.quiz].filter(Boolean).length / 3) * 100} tone={state.completed ? 'green' : 'navy'} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Key points</h3>
            <ul className="space-y-1.5 text-xs text-slate-600">{lesson.keyPoints.map((k) => <li key={k} className="flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-navy-400" />{k}</li>)}</ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Resources</h3>
            <ul className="space-y-1">
              {lesson.resources.map((r) => (
                <li key={r.id}><button onClick={() => openResource(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-50"><FileText className="size-3.5 shrink-0 text-muted" /><span className="truncate">{r.name}</span></button></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <ResourceViewer resource={viewing} onClose={() => setViewing(null)} onOpened={(r) => markResourceViewed(user.id, lesson.id, r.id)} />
    </div>
  )
}
