export type Role = 'student' | 'admin'
export type AccountStatus = 'active' | 'inactive'

export interface User {
  id: string
  role: Role
  /** e.g. CIPM/2026/0012 — students only */
  studentNo?: string
  name: string
  email: string
  phone: string
  password: string
  /** data URL of an uploaded profile photo */
  photo?: string
  /** job title, used for admins */
  title?: string
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface Course {
  id: string
  code: string
  title: string
  subtitle: string
  description: string
  /** data URL of an uploaded thumbnail; falls back to generated cover art */
  thumbnail?: string
  fee: number
  durationMonths: number
  level: string
  outcomes: string[]
  published: boolean
  createdAt: string
}

export type Progression = 'sequential' | 'independent'

export interface Module {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  progression: Progression
  published: boolean
}

export type ResourceType = 'pdf' | 'doc' | 'ppt' | 'text' | 'link' | 'attachment'

export interface Resource {
  id: string
  name: string
  type: ResourceType
  sizeKb: number
  /** external URL (type "link") */
  url?: string
  /**
   * Preview content. Plain text; blank lines separate paragraphs (or slides for "ppt"),
   * lines starting with "# " are headings, lines starting with "- " are bullets.
   */
  body: string
  downloadable: boolean
}

export interface LessonVideo {
  title: string
  /** direct video URL (mp4/webm). Empty = simulated lecture playback. */
  url: string
  durationSec: number
}

export interface Lesson {
  id: string
  moduleId: string
  title: string
  summary: string
  /** lesson notes shown as text content */
  content: string
  keyPoints: string[]
  order: number
  published: boolean
  resources: Resource[]
  video: LessonVideo
  /** one or more assessment activities */
  quizIds: string[]
}

export type QuestionType = 'mcq' | 'multi' | 'tf' | 'blank'

export interface QuestionOption {
  id: string
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  text: string
  /** mcq / multi: answer options. tf: fixed True/False (ids "true"/"false"). blank: unused. */
  options: QuestionOption[]
  /** mcq/multi/tf: correct option ids. blank: accepted answers (case-insensitive). */
  correct: string[]
  marks: number
  explanation: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  /** minutes; 0 = no time limit */
  timeLimitMin: number
  /** null = use the system default from Settings */
  maxAttempts: number | null
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  showExplanations: boolean
  showCorrectAnswers: boolean
  questions: Question[]
}

export interface QuizAttempt {
  id: string
  quizId: string
  lessonId: string
  userId: string
  startedAt: string
  submittedAt: string
  durationSec: number
  answers: Record<string, string[]>
  score: number
  total: number
  percent: number
}

export interface LessonProgress {
  userId: string
  lessonId: string
  resourcesViewed: string[]
  materialsDoneAt?: string
  videoPosition: number
  videoMaxPosition: number
  videoDoneAt?: string
  /** set once Materials → Video → Quiz are all done; sticky */
  completedAt?: string
  lastAccessedAt: string
}

export type EnrollmentStatus = 'active' | 'completed' | 'suspended' | 'cancelled'

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  intakeId: string
  paymentId?: string
  status: EnrollmentStatus
  enrolledAt: string
  completedAt?: string
  accessExpiresAt: string
}

export interface Intake {
  id: string
  courseId: string
  name: string
  /** induction date */
  date: string
  registrationDeadline: string
  capacity: number
  status: 'open' | 'closed'
}

export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded'
export type PaymentMethod = 'card' | 'bank'

export interface Payment {
  id: string
  reference: string
  userId: string
  courseId: string
  intakeId: string
  amount: number
  method: PaymentMethod
  cardLast4?: string
  status: PaymentStatus
  date: string
  note?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  category: 'general' | 'course' | 'enrollment'
  audience: 'all' | 'intakes'
  intakeIds: string[]
  published: boolean
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'enrollment' | 'payment' | 'course' | 'certificate'
  title: string
  body: string
  createdAt: string
}

export interface Certificate {
  id: string
  number: string
  userId: string
  courseId: string
  issuedAt: string
}

export type ActivityType =
  | 'registered'
  | 'enrolled'
  | 'payment'
  | 'lesson_completed'
  | 'quiz_submitted'
  | 'module_completed'
  | 'course_completed'
  | 'login'

export interface Activity {
  id: string
  userId: string
  type: ActivityType
  text: string
  at: string
}

export interface Settings {
  /** days of the month on which inductions are held */
  intakeDays: number[]
  defaultIntakeCapacity: number
  maxQuizAttempts: number
  accessDurationMonths: number
  video: {
    /** demo configuration only — a browser cannot prevent screen capture */
    watermark: boolean
    /** deterrents: hidden source, no download/PiP/right-click, pause on focus loss, blank on PrintScreen */
    protectedPlayback?: boolean
    restrictForwardSeek: boolean
    allowSpeedControl: boolean
    requiredWatchPercent: number
  }
  certificate: {
    autoIssue: boolean
    numberPrefix: string
    signatoryName: string
    signatoryTitle: string
  }
  notifications: {
    enrollment: boolean
    payment: boolean
    courseUpdates: boolean
    certificate: boolean
  }
}

export interface DB {
  version: number
  seededAt: string
  session: { userId: string | null }
  users: User[]
  courses: Course[]
  modules: Module[]
  lessons: Lesson[]
  quizzes: Quiz[]
  attempts: QuizAttempt[]
  progress: LessonProgress[]
  enrollments: Enrollment[]
  intakes: Intake[]
  payments: Payment[]
  announcements: Announcement[]
  notifications: Notification[]
  certificates: Certificate[]
  activities: Activity[]
  settings: Settings
  /** per-user ids of announcements / notifications already read */
  reads: Record<string, string[]>
}
