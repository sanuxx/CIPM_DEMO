import { useEffect } from 'react'
import { BookOpen, Megaphone, UserCheck, CreditCard, Award } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { getFeed } from '@/lib/progress'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'
import { markRead } from '@/store/actions'
import { formatDateTime, timeAgo } from '@/lib/utils'

const ICONS = { general: Megaphone, course: BookOpen, enrollment: UserCheck, payment: CreditCard, certificate: Award } as const

export default function Announcements() {
  const { db, user } = useStudent()
  const feed = getFeed(db, user.id)
  const read = new Set(db.reads[user.id] ?? [])
  const unread = feed.filter((f) => !read.has(f.id))
  // Items are marked read when the page is left, so unread dots stay visible while viewing.
  useEffect(() => () => markRead(user.id, getFeed(db, user.id).map((f) => f.id)), [])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader title="Announcements" description="News from eArrow and updates about your enrollment." actions={unread.length > 0 ? <Button variant="outline" onClick={() => markRead(user.id, unread.map((f) => f.id))}>Mark all as read</Button> : undefined} />
      <div className="space-y-3">
        {feed.map((f) => {
          const Icon = ICONS[f.category]
          const isNew = !read.has(f.id)
          return (
            <Card key={f.id} className="flex gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{f.title}</h2>{isNew && <Badge tone="amber">New</Badge>}<Badge>{f.kind === 'announcement' ? 'Announcement' : 'Personal'}</Badge></div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{f.body}</p>
                <p className="mt-2 text-xs text-muted" title={formatDateTime(f.at)}>{timeAgo(f.at)}</p>
              </div>
            </Card>
          )
        })}
        {feed.length === 0 && <Card><EmptyState icon={Megaphone} title="No announcements" description="You are all caught up." /></Card>}
      </div>
    </>
  )
}
