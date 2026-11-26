/**
 * Generates the initial demo database. All people, payments and results are fictional.
 * Dates are generated relative to "today" so the demo always looks current.
 */
import type { Course, DB, Intake, Lesson, Module, Question, Quiz, Resource, Settings } from '@/types'
import { COURSE_SEED, MODULE_SEEDS, type QSeed } from './content'
import { createPayment, applyPaymentStatus, ensureProgress, logActivity, newStudent, recordAttempt } from '@/store/logic'
import { getModuleLessons } from '@/lib/progress'

export const DB_VERSION = 3
export const COURSE_ID = 'course-chrm'

export const DEMO_ACCOUNTS = {
  fresh: { email: 'ishara.madushan@earrowdemo.example', password: 'Demo@123', name: 'Ishara Madushan' },
  active: { email: 'kasun.perera@earrowdemo.example', password: 'Demo@123', name: 'Kasun Perera' },
  completed: { email: 'dilini.wickramasinghe@earrowdemo.example', password: 'Demo@123', name: 'Dilini Wickramasinghe' },
  admin: { email: 'admin@earrowdemo.example', password: 'Admin@123', name: 'Anoma Weerasinghe' },
} as const

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function defaultSettings(): Settings {
  return {
    intakeDays: [1, 15],
    defaultIntakeCapacity: 40,
    maxQuizAttempts: 3,
    accessDurationMonths: 12,
    video: { watermark: true, protectedPlayback: true, restrictForwardSeek: false, allowSpeedControl: true, requiredWatchPercent: 90 },
    certificate: {
      autoIssue: true,
      numberPrefix: 'EARROW',
      signatoryName: 'Dr. Ranjith Wijeratne',
      signatoryTitle: 'Director – Learning & Development (Demo)',
    },
    notifications: { enrollment: true, payment: true, courseUpdates: true, certificate: true },
  }
}

const LINKS = [
  ['International Labour Organization – Human resources development', 'https://www.ilo.org/'],
  ['International Labour Organization – Employment and skills', 'https://www.ilo.org/'],
  ['International Labour Organization – Skills and lifelong learning', 'https://www.ilo.org/'],
  ['International Labour Organization – Wages and working conditions', 'https://www.ilo.org/'],
  ['Department of Labour, Sri Lanka – Labour legislation', 'https://labourdept.gov.lk/'],
  ['International Labour Organization – Labour statistics (ILOSTAT)', 'https://ilostat.ilo.org/'],
  ['World Health Organization – Mental health at work', 'https://www.who.int/'],
  ['International Labour Organization – Fundamental principles and rights at work', 'https://www.ilo.org/'],
]

function buildQuestion(seed: QSeed, id: string): Question {
  const letter = (i: number) => `${id}-${String.fromCharCode(97 + i)}`
  switch (seed.k) {
    case 'mcq': {
      const options = seed.o.map((text, i) => ({ id: letter(i), text }))
      return { id, type: 'mcq', text: seed.q, options, correct: [letter(seed.a)], marks: 1, explanation: seed.e }
    }
    case 'multi': {
      const options = seed.o.map((text, i) => ({ id: letter(i), text }))
      return { id, type: 'multi', text: seed.q, options, correct: seed.a.map(letter), marks: 2, explanation: seed.e }
    }
    case 'tf':
      return { id, type: 'tf', text: seed.q, options: [], correct: [String(seed.a)], marks: 1, explanation: seed.e }
    case 'blank':
      return { id, type: 'blank', text: seed.q, options: [], correct: seed.a, marks: 1, explanation: seed.e }
  }
}

export function buildCourseContent(nowIso: string) {
  const rand = mulberry32(77)
  const course: Course = {
    id: COURSE_ID,
    code: COURSE_SEED.code,
    title: COURSE_SEED.title,
    subtitle: COURSE_SEED.subtitle,
    description: COURSE_SEED.description,
    fee: COURSE_SEED.fee,
    durationMonths: COURSE_SEED.durationMonths,
    level: COURSE_SEED.level,
    outcomes: COURSE_SEED.outcomes,
    published: true,
    createdAt: nowIso,
  }
  const modules: Module[] = []
  const lessons: Lesson[] = []
  const quizzes: Quiz[] = []

  MODULE_SEEDS.forEach((ms, mi) => {
    const m = mi + 1
    modules.push({
      id: `mod-${m}`, courseId: course.id, title: ms.title, description: ms.description,
      order: m, progression: ms.progression, published: true,
    })
    ms.lessons.forEach((ls, li) => {
      const l = li + 1
      const key = `${m}-${l}`
      const size = (min: number, max: number) => Math.round(min + rand() * (max - min))
      const guide = [
        `# ${ls.title}`, ls.summary,
        ...ls.points.flatMap(([h, body]) => [`# ${h}`, body]),
        '# Reflection',
        'Think about an organisation you know well. Which of the ideas above does it apply effectively, and where is there room to improve? Note two practical actions you could take.',
        'Demo study material — prepared for the eArrow LMS demonstration.',
      ].join('\n\n')
      const slides = [
        `${ls.title}\n- Module ${m}: ${ms.title}\n- Lesson ${l} of ${ms.lessons.length}`,
        `Learning objectives\n${ls.points.map(([h]) => `- ${h}`).join('\n')}`,
        ...ls.points.map(([h, body]) => `${h}\n${body.split('. ').filter(Boolean).map((s) => `- ${s.replace(/\.$/, '')}`).join('\n')}`),
        `Summary\n- ${ls.summary}\n- Complete the knowledge check to finish this lesson`,
      ].join('\n\n')
      const resources: Resource[] = [
        { id: `res-${key}-a`, name: `${ls.title} – Study Guide.pdf`, type: 'pdf', sizeKb: size(420, 1900), body: guide, downloadable: true },
        { id: `res-${key}-b`, name: `${ls.title} – Lecture Slides.pptx`, type: 'ppt', sizeKb: size(1500, 5200), body: slides, downloadable: true },
      ]
      const variant = (mi + li) % 3
      if (variant === 0) {
        resources.push({
          id: `res-${key}-c`, name: `${ls.title} – Practice Worksheet.docx`, type: 'doc', sizeKb: size(60, 240), downloadable: true,
          body: [
            `# Practice worksheet: ${ls.title}`,
            'Complete the activities below in your own words. Bring your answers to the next discussion session.',
            ...ls.points.map(([h], i) => `# Activity ${i + 1}: ${h}\n\nDescribe how this applies in your current or a previous workplace. Give one specific example and one improvement you would recommend.`),
          ].join('\n\n'),
        })
      } else if (variant === 1) {
        const [name, url] = LINKS[mi]
        resources.push({
          id: `res-${key}-c`, name, type: 'link', sizeKb: 0, url, downloadable: false,
          body: 'External learning resource. Opens the publisher\'s website in a new browser tab.',
        })
      } else {
        resources.push({
          id: `res-${key}-c`, name: `${ls.title} – Key Terms`, type: 'text', sizeKb: size(4, 12), downloadable: true,
          body: [`# Key terms`, ...ls.points.map(([h, body]) => `- ${h}: ${body.split('. ')[0]}.`)].join('\n'),
        })
      }
      if (li === 0) {
        resources.push({
          id: `res-${key}-d`, name: `Module ${m} – Templates and Checklists.zip`, type: 'attachment', sizeKb: size(800, 3400), downloadable: true,
          body: `# Contents of this pack\n- Module ${m} overview and study planner\n- Checklist: ${ms.lessons.map((x) => x.title).join('; ')}\n- Editable templates for workplace application\n\nDemo attachment — the download contains a text summary of the pack.`,
        })
      }
      const quizId = `quiz-${key}`
      quizzes.push({
        id: quizId,
        title: `${ls.title} – Knowledge Check`,
        description: 'A short check on the key ideas from this lesson. There is no pass mark — submitting the quiz completes the activity.',
        timeLimitMin: 10,
        maxAttempts: null,
        shuffleQuestions: false,
        shuffleAnswers: true,
        showExplanations: true,
        showCorrectAnswers: true,
        questions: ls.quiz.map((q, qi) => buildQuestion(q, `q-${key}-${qi + 1}`)),
      })
      lessons.push({
        id: `les-${key}`,
        moduleId: `mod-${m}`,
        title: ls.title,
        summary: ls.summary,
        content: ls.points.map(([h, body]) => `# ${h}\n\n${body}`).join('\n\n'),
        keyPoints: ls.points.map(([h]) => h),
        order: l,
        published: true,
        resources,
        video: { title: `Lecture: ${ls.title}`, url: '', durationSec: ls.minutes * 60 + Math.round(rand() * 50) },
        quizIds: [quizId],
      })
    })
  })
  return { course, modules, lessons, quizzes }
}

const ordinalName = (d: Date) => `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} Intake`

/** Suggested induction dates: the configured days (1st and 15th) of each month. */
export function suggestIntakeDates(days: number[], fromMonthOffset: number, toMonthOffset: number, now = new Date()): Date[] {
  const out: Date[] = []
  for (let m = fromMonthOffset; m <= toMonthOffset; m++) {
    for (const day of [...days].sort((a, b) => a - b)) {
      out.push(new Date(now.getFullYear(), now.getMonth() + m, day, 9, 0, 0))
    }
  }
  return out
}

export function makeIntake(courseId: string, date: Date, capacity: number, now = new Date()): Intake {
  const deadline = new Date(date)
  deadline.setDate(deadline.getDate() - 1)
  deadline.setHours(23, 59, 0, 0)
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return {
    id: `int-${ymd}`,
    courseId,
    name: ordinalName(date),
    date: date.toISOString(),
    registrationDeadline: deadline.toISOString(),
    capacity,
    status: date.getTime() < now.getTime() ? 'closed' : 'open',
  }
}

/**
 * [name, phone, lessons completed per module (M1..M8), intake index, flag]
 * intake index: 0 = most recent past intake, 1 = the one before … ; -1 = next upcoming intake
 */
type Flag = 'none' | 'unenrolled' | 'pending' | 'failed' | 'refunded' | 'suspended' | 'retry' | 'partial'
const STUDENTS: [string, string, number[], number, Flag][] = [
  ['Kasun Perera', '+94 77 234 5678', [3, 1, 0, 0, 2, 0, 0, 0], 2, 'partial'],
  ['Dilini Wickramasinghe', '+94 71 456 7890', [3, 3, 3, 3, 3, 3, 3, 3], 9, 'none'],
  ['Tharindu Jayasinghe', '+94 76 345 1209', [3, 3, 2, 0, 3, 1, 0, 0], 5, 'retry'],
  ['Nimali Fernando', '+94 70 298 4417', [3, 3, 3, 3, 3, 3, 3, 2], 7, 'none'],
  ['Mohamed Rizwan', '+94 75 612 3348', [2, 0, 0, 0, 0, 0, 0, 0], 1, 'none'],
  ['Priyanka Selvarajah', '+94 77 903 2261', [3, 3, 3, 1, 3, 3, 0, 1], 6, 'none'],
  ['Chamara Bandara', '+94 71 220 8754', [0, 0, 0, 0, 0, 0, 0, 0], 0, 'none'],
  ['Sanduni Herath', '+94 78 441 9032', [3, 3, 3, 3, 3, 3, 3, 3], 10, 'none'],
  ['Ravindu de Silva', '+94 72 587 1146', [3, 2, 0, 0, 0, 3, 0, 0], 4, 'retry'],
  ['Fathima Nazeer', '+94 76 734 5521', [3, 3, 3, 3, 2, 2, 2, 2], 8, 'none'],
  ['Lahiru Gunawardena', '+94 70 815 6673', [1, 0, 0, 0, 1, 0, 0, 0], 1, 'none'],
  ['Kavindi Rathnayake', '+94 77 362 9048', [3, 3, 0, 0, 3, 3, 3, 0], 5, 'none'],
  ['Suresh Nadarajah', '+94 75 190 4482', [3, 0, 0, 0, 0, 0, 2, 0], 3, 'none'],
  ['Hiruni Senanayake', '+94 71 678 3359', [3, 3, 3, 3, 3, 3, 3, 3], 9, 'none'],
  ['Dinesh Karunaratne', '+94 78 259 7714', [3, 1, 0, 0, 0, 0, 0, 3], 3, 'none'],
  ['Anjali Sivakumar', '+94 76 483 1297', [0, 0, 0, 0, 1, 0, 0, 0], 0, 'none'],
  ['Buddhika Amarasinghe', '+94 72 906 5538', [3, 3, 3, 2, 1, 0, 0, 0], 7, 'suspended'],
  ['Thilini Dissanayake', '+94 70 547 2286', [2, 0, 0, 0, 3, 0, 0, 0], 2, 'none'],
  ['Imran Farook', '+94 77 128 6695', [0, 0, 0, 0, 0, 0, 0, 0], -1, 'none'],
  ['Nadeesha Samarakoon', '+94 71 835 4407', [3, 3, 1, 0, 2, 2, 0, 0], 4, 'none'],
  ['Yohan Abeysekera', '+94 75 374 9921', [0, 0, 0, 0, 0, 0, 0, 0], -1, 'none'],
  ['Madhavi Ekanayake', '+94 78 692 0153', [3, 3, 3, 0, 0, 0, 3, 3], 6, 'none'],
  ['Roshan Wijesekara', '+94 76 251 8840', [0, 0, 0, 0, 0, 0, 0, 0], 3, 'refunded'],
  ['Ishara Madushan', '+94 77 510 3376', [], 0, 'unenrolled'],
  ['Gayan Liyanage', '+94 71 947 2265', [], -1, 'pending'],
  ['Shanika Peiris', '+94 70 386 5519', [], -1, 'failed'],
]

const emailOf = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@earrowdemo.example`

export function createSeed(): DB {
  const now = new Date()
  const nowIso = now.toISOString()
  const rand = mulberry32(20261)
  const { course, modules, lessons, quizzes } = buildCourseContent(new Date(now.getFullYear(), now.getMonth() - 7, 3).toISOString())
  const settings = defaultSettings()
  const intakes = suggestIntakeDates(settings.intakeDays, -5, 3, now).map((d) => makeIntake(course.id, d, settings.defaultIntakeCapacity, now))
  const past = intakes.filter((i) => new Date(i.date).getTime() < now.getTime()).reverse()
  const upcoming = intakes.filter((i) => new Date(i.registrationDeadline).getTime() >= now.getTime())

  const db: DB = {
    version: DB_VERSION,
    seededAt: nowIso,
    session: { userId: null },
    users: [
      {
        id: 'usr-admin', role: 'admin', name: DEMO_ACCOUNTS.admin.name, email: DEMO_ACCOUNTS.admin.email,
        phone: '+94 11 258 9000', password: DEMO_ACCOUNTS.admin.password, title: 'LMS Administrator',
        status: 'active', emailVerified: true, createdAt: course.createdAt,
      },
    ],
    courses: [course], modules, lessons, quizzes,
    attempts: [], progress: [], enrollments: [], intakes, payments: [],
    announcements: [], notifications: [], certificates: [], activities: [],
    settings, reads: {},
  }

  const iso = (ms: number) => new Date(ms).toISOString()
  const DAY = 86400000

  for (const [name, phone, plan, intakeIdx, flag] of STUDENTS) {
    const intake = intakeIdx < 0 ? upcoming[0] : past[Math.min(intakeIdx, past.length - 1)]
    const enrolledMs = intakeIdx < 0
      ? now.getTime() - (1 + rand() * 4) * DAY
      : Math.min(now.getTime() - DAY, new Date(intake.date).getTime() - (3 + rand() * 9) * DAY + rand() * 8 * 3600000)
    const registeredMs = enrolledMs - (0.2 + rand() * 2) * DAY
    const user = newStudent(db, { name, phone, email: emailOf(name), password: 'Demo@123' }, iso(registeredMs), true)
    user.lastLoginAt = iso(now.getTime() - rand() * 6 * DAY)

    if (flag === 'unenrolled') continue
    const base = { userId: user.id, courseId: course.id, intakeId: intake.id, amount: course.fee }
    if (flag === 'pending') {
      createPayment(db, { ...base, method: 'bank', status: 'pending', note: 'Bank transfer slip uploaded — awaiting verification' }, iso(enrolledMs))
      continue
    }
    if (flag === 'failed') {
      createPayment(db, { ...base, method: 'card', cardLast4: '0341', status: 'failed', note: 'Card declined by issuing bank (simulated)' }, iso(enrolledMs))
      continue
    }
    if (flag === 'retry') {
      createPayment(db, { ...base, method: 'card', cardLast4: '7782', status: 'failed', note: 'Insufficient funds (simulated)' }, iso(enrolledMs - 9 * 60000))
    }
    const method = rand() < 0.75 ? 'card' : 'bank'
    const payment = createPayment(
      db,
      { ...base, method, cardLast4: method === 'card' ? String(1000 + Math.floor(rand() * 9000)) : undefined, status: 'success' },
      iso(enrolledMs),
    )
    if (flag === 'refunded') {
      applyPaymentStatus(db, payment.id, 'refunded', iso(enrolledMs + 6 * DAY))
      continue
    }

    // Walk the plan and complete lessons through the same logic the live app uses.
    const total = plan.reduce((s, n) => s + n, 0)
    const span = now.getTime() - enrolledMs - 0.5 * DAY
    const ability = 0.62 + rand() * 0.33
    let k = 0
    plan.forEach((count, mi) => {
      const moduleLessons = getModuleLessons(db, modules[mi].id)
      for (let li = 0; li < count; li++) {
        const lesson = moduleLessons[li]
        k++
        const t = enrolledMs + (span * k) / (total + 1)
        const p = ensureProgress(db, user.id, lesson.id, iso(t))
        p.resourcesViewed = lesson.resources.map((r) => r.id)
        p.materialsDoneAt = iso(t - 50 * 60000)
        p.videoPosition = lesson.video.durationSec
        p.videoMaxPosition = lesson.video.durationSec
        p.videoDoneAt = iso(t - 14 * 60000)
        const quiz = quizzes.find((q) => q.id === lesson.quizIds[0]) as Quiz
        const tries = rand() < 0.28 ? 2 : 1
        for (let a = 0; a < tries; a++) {
          const skill = Math.min(0.97, ability - (tries - 1 - a) * 0.25)
          const answers: Record<string, string[]> = {}
          for (const q of quiz.questions) {
            const right = rand() < skill
            if (right) answers[q.id] = q.type === 'blank' ? [q.correct[0]] : [...q.correct]
            else if (q.type === 'mcq') answers[q.id] = [q.options.find((o) => o.id !== q.correct[0])!.id]
            else if (q.type === 'tf') answers[q.id] = [q.correct[0] === 'true' ? 'false' : 'true']
            else if (q.type === 'multi') answers[q.id] = [q.options[q.options.length - 1].id, q.correct[0]]
            else answers[q.id] = ['not sure']
          }
          const submitted = t - (tries - 1 - a) * 11 * 60000
          recordAttempt(db, {
            quiz, lessonId: lesson.id, userId: user.id, answers,
            startedAt: iso(submitted - (3 + rand() * 5) * 60000), submittedAt: iso(submitted),
          })
        }
      }
    })

    if (flag === 'partial') {
      // The active demo student is part-way through Module 2, Lesson 2.
      const lesson = getModuleLessons(db, modules[1].id)[1]
      const t = now.getTime() - 20 * 3600000
      const p = ensureProgress(db, user.id, lesson.id, iso(t))
      p.resourcesViewed = lesson.resources.map((r) => r.id)
      p.materialsDoneAt = iso(t - 20 * 60000)
      p.videoPosition = Math.round(lesson.video.durationSec * 0.42)
      p.videoMaxPosition = p.videoPosition
    }
    if (flag === 'suspended') {
      user.status = 'inactive'
      const enr = db.enrollments.find((e) => e.userId === user.id)
      if (enr) enr.status = 'suspended'
    }
  }

  db.users.find((u) => u.email === DEMO_ACCOUNTS.fresh.email)!.createdAt = iso(now.getTime() - 2 * 3600000)

  const nextIntake = upcoming[0]
  db.announcements = [
    {
      id: 'ann-1', title: 'Welcome to the eArrow Learning Portal', category: 'general', audience: 'all', intakeIds: [], published: true,
      createdAt: iso(now.getTime() - 20 * DAY),
      body: 'Your course materials, recorded lectures and knowledge checks are all available here. Start with Module 1, and remember that Modules 5 to 8 can be studied at any time. If you need help, visit Help & Support.',
    },
    {
      id: 'ann-2', title: 'Module 5 study guides updated', category: 'course', audience: 'all', intakeIds: [], published: true,
      createdAt: iso(now.getTime() - 6 * DAY),
      body: 'The study guides for Sri Lankan Labour Law Essentials have been refreshed with clearer worked examples on EPF, ETF and gratuity calculations. Please download the latest versions from the lesson pages.',
    },
    {
      id: 'ann-3', title: `Induction session for the ${nextIntake.name}`, category: 'enrollment', audience: 'intakes', intakeIds: [nextIntake.id], published: true,
      createdAt: iso(now.getTime() - 2 * DAY),
      body: 'Your online induction session starts at 9.00 a.m. on the induction date. The joining link will be emailed the day before. Please complete your profile and upload a photo before the session.',
    },
    {
      id: 'ann-4', title: 'Scheduled maintenance this Sunday', category: 'general', audience: 'all', intakeIds: [], published: true,
      createdAt: iso(now.getTime() - 1 * DAY),
      body: 'The learning portal will be unavailable on Sunday from 1.00 a.m. to 3.00 a.m. for routine maintenance. Your progress is saved automatically and will not be affected.',
    },
    {
      id: 'ann-5', title: 'Guest lecture: HR in the apparel sector', category: 'course', audience: 'all', intakeIds: [], published: false,
      createdAt: iso(now.getTime() - 3 * 3600000),
      body: 'Draft — a guest practitioner session on people practices in Sri Lanka\'s apparel industry is being planned for next month. Details will follow.',
    },
  ]

  // Recent sign-ins make the activity chart look alive.
  db.users.filter((u) => u.role === 'student').forEach((u) => {
    const n = Math.floor(rand() * 4)
    for (let i = 0; i < n; i++) logActivity(db, u.id, 'login', 'Signed in to the learning portal', iso(now.getTime() - rand() * 13 * DAY))
  })
  db.activities.sort((a, b) => a.at.localeCompare(b.at))
  return db
}
