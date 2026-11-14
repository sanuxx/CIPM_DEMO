import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Award, Download, Eye, Lock, Printer } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { Button, Card, EmptyState, Modal, PageHeader, ProgressBar } from '@/components/ui'
import { CertificateView, downloadCertificateSvg, verifyUrl } from '@/components/Certificate'
import { formatLongDate } from '@/lib/utils'
import { issueCertificateNow } from '@/store/actions'

export default function Certificates() {
  const { db, user, course, stats, certificate } = useStudent()
  const [open, setOpen] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  if (!course || !stats) return null
  const data = certificate && {
    studentName: user.name, courseTitle: course.title, number: certificate.number, issuedAt: certificate.issuedAt,
    signatoryName: db.settings.certificate.signatoryName, signatoryTitle: db.settings.certificate.signatoryTitle,
  }

  return (
    <>
      <PageHeader title="My certificates" description="Your certificate is issued automatically when all eight modules are complete." />
      {certificate && data ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card className="overflow-hidden p-3"><CertificateView ref={svg} data={data} /></Card>
          <div className="space-y-4">
            <Card className="space-y-3 p-5 text-sm">
              <div className="flex items-center gap-2 font-semibold"><Award className="size-5 text-accent-600" />Certificate details</div>
              <dl className="space-y-2">
                <div><dt className="text-xs text-muted">Certificate number</dt><dd className="font-mono font-medium">{certificate.number}</dd></div>
                <div><dt className="text-xs text-muted">Issued</dt><dd className="font-medium">{formatLongDate(certificate.issuedAt)}</dd></div>
                <div><dt className="text-xs text-muted">Verification link (simulated)</dt><dd className="break-all text-xs font-medium text-navy-700">{verifyUrl(certificate.number)}</dd></div>
              </dl>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => setOpen(true)}><Eye className="size-4" />Preview full size</Button>
                <Button variant="outline" onClick={() => { if (svg.current) { downloadCertificateSvg(svg.current, certificate.number); toast.success('Certificate downloaded') } }}><Download className="size-4" />Download (SVG)</Button>
                <Button variant="outline" onClick={() => { setOpen(true); setTimeout(() => window.print(), 300) }}><Printer className="size-4" />Print / save as PDF</Button>
              </div>
            </Card>
          </div>
          <Modal open={open} onOpenChange={setOpen} title="Certificate preview" size="xl" footer={<Button onClick={() => setOpen(false)}>Close</Button>}>
            {data && <div className="print-area"><CertificateView data={data} /></div>}
          </Modal>
        </div>
      ) : (
        <Card>
          <EmptyState icon={Lock} title="Certificate not available yet" description={`Complete all ${stats.modulesTotal} modules to receive your certificate. You have completed ${stats.modulesDone} so far.`}
            action={stats.complete ? <Button onClick={() => { issueCertificateNow(user.id, course.id); toast.success('Certificate generated') }}>Generate certificate</Button> : undefined} />
          <div className="mx-auto mb-8 max-w-sm"><ProgressBar value={stats.percent} /><p className="mt-2 text-center text-xs text-muted">{stats.percent}% of lessons completed</p></div>
        </Card>
      )}
    </>
  )
}
