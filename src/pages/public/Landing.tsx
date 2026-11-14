import { Link } from 'react-router-dom'
import { Award, CalendarDays, CheckCircle2, Clock, GraduationCap, Layers, Lock, PlayCircle, Unlock } from 'lucide-react'
import { useDB } from '@/store/db'
import { useAuth } from '@/store/hooks'
import { Badge, Button, Card, CardHeader, DemoBadge } from '@/components/ui'
import { CoverArt, Logo } from '@/components/common'
import { formatDate, formatLKR } from '@/lib/utils'
import { getCourseLessons, getCourseModules, getModuleLessons, getIntakeEnrolledCount, getOpenIntakes } from '@/lib/progress'

export default function Landing() {
  const db = useDB()
  const { user } = useAuth()
  const course = db.courses.find((c) => c.published)
  const modules = course ? getCourseModules(db, course.id) : []
  const lessons = course ? getCourseLessons(db, course.id) : []
  const intakes = course ? getOpenIntakes(db, course.id).slice(0, 6) : []
  const home = user ? (user.role === 'admin' ? '/admin' : '/app') : '/login'

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <DemoBadge className="hidden sm:inline-flex" />
            {user ? (
              <Link to={home}><Button>Go to my portal</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
                <Link to="/register"><Button>Register</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      {!course ? (
        <p className="p-16 text-center text-muted">No course is currently published.</p>
      ) : (
        <>
          <section className="bg-gradient-to-b from-navy-50/70 to-white">
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
              <div>
                <Badge tone="navy">{course.level} · {course.code}</Badge>
                <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">{course.title}</h1>
                <p className="mt-3 text-slate-500">{course.subtitle}</p>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600">{course.description}</p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link to={user?.role === 'student' ? '/app/enroll' : '/register'}>
                    <Button size="lg">Enrol now · {formatLKR(course.fee)}</Button>
                  </Link>
                  <a href="#content"><Button size="lg" variant="outline">View course content</Button></a>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl shadow-pop ring-1 ring-line">
                <div className="aspect-video"><CoverArt seed={course.id} label={course.title} src={course.thumbnail} /></div>
              </div>
            </div>
            <div className="border-t border-line bg-white">
              <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4">
                {[
                  [Clock, 'Duration', `${course.durationMonths} months`],
                  [Layers, 'Modules', String(modules.length)],
                  [PlayCircle, 'Lessons', String(lessons.length)],
                  [Award, 'Course fee', formatLKR(course.fee)],
                ].map(([Icon, k, v]) => {
                  const I = Icon as typeof Clock
                  return (
                    <div key={k as string} className="flex items-center gap-3 py-5">
                      <I className="size-5 text-navy-500" />
                      <div><dt className="text-xs text-muted">{k as string}</dt><dd className="text-sm font-semibold">{v as string}</dd></div>
                    </div>
                  )
                })}
              </dl>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold">What you will learn</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {course.outcomes.map((o) => (
                    <li key={o} className="flex gap-3 rounded-xl border border-line p-4 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{o}
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="h-fit" id="intakes">
                <CardHeader title="Upcoming induction dates" description="Inductions run on the 1st and 15th of each month" />
                <ul className="divide-y divide-line">
                  {intakes.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                      <CalendarDays className="size-4 text-navy-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{formatDate(i.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs text-muted">Register by {formatDate(i.registrationDeadline)}</p>
                      </div>
                      <Badge tone="blue">{i.capacity - getIntakeEnrolledCount(db, i.id)} seats</Badge>
                    </li>
                  ))}
                  {intakes.length === 0 && <li className="px-5 py-6 text-sm text-muted">No intakes are open for registration right now.</li>}
                </ul>
                <div className="p-4"><Link to={user?.role === 'student' ? '/app/enroll' : '/register'}><Button className="w-full">Choose an induction date</Button></Link></div>
              </Card>
            </div>
          </section>

          <section id="content" className="bg-surface/70">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <h2 className="text-xl font-semibold">Course content</h2>
              <p className="mt-1 text-sm text-muted">Modules 1–4 are studied in sequence. Modules 5–8 are independent and open from day one.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {modules.map((m) => (
                  <Card key={m.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-sm font-bold text-navy-800">{m.order}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug">{m.title}</h3>
                        <p className="mt-1 text-sm text-muted">{m.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <Badge tone={m.progression === 'sequential' ? 'amber' : 'green'}>
                            {m.progression === 'sequential' ? <Lock className="size-3" /> : <Unlock className="size-3" />}
                            {m.progression === 'sequential' ? 'Sequential' : 'Independent'}
                          </Badge>
                          <span className="text-muted">{getModuleLessons(db, m.id).length} lessons</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        <GraduationCap className="mx-auto mb-2 size-5 text-navy-600" />
        CIPM Learning Portal — interactive demo. All names, content and payments are fictional or simulated.
      </footer>
    </div>
  )
}
