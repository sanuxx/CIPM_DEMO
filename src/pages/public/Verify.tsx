import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, MailCheck } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button, Card } from '@/components/ui'
import { useAuth } from '@/store/hooks'
import { verifyEmail } from '@/store/actions'
import { sleep } from '@/lib/utils'

export default function Verify() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  if (!user) return <Navigate to="/login" replace />
  const next = user.role === 'admin' ? '/admin' : '/app/enroll'

  return (
    <AuthLayout title="Verify your email" subtitle="One quick step before you choose your induction date.">
      <Card className="space-y-4 p-6 text-center">
        {user.emailVerified ? (
          <>
            <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
            <p className="text-sm">Your email <strong>{user.email}</strong> is verified.</p>
            <Button className="w-full" onClick={() => navigate(next)}>Continue to enrollment</Button>
          </>
        ) : (
          <>
            <MailCheck className="mx-auto size-10 text-navy-700" />
            <p className="text-sm text-slate-700">We sent a verification link to <strong>{user.email}</strong>.</p>
            <p className="text-xs text-muted">Demo: no real email is sent. Click below to simulate opening the link.</p>
            <Button className="w-full" loading={busy} onClick={async () => { setBusy(true); await sleep(700); verifyEmail(user.id); setBusy(false); toast.success('Email verified') }}>Verify my email</Button>
            <Button variant="ghost" className="w-full" onClick={() => toast.info('Verification email re-sent (simulated)')}>Resend email</Button>
            <Link to={next} className="block text-sm font-medium text-navy-700 hover:underline">Skip for now</Link>
          </>
        )}
      </Card>
    </AuthLayout>
  )
}
