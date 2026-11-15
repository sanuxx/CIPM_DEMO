import { CIPM_LOGO_INNER, CIPM_LOGO_VIEWBOX } from '@/data/cipmLogo'
import { forwardRef } from 'react'
import { hashString, formatLongDate } from '@/lib/utils'

export interface CertificateData {
  studentName: string
  courseTitle: string
  number: string
  issuedAt: string
  signatoryName: string
  signatoryTitle: string
}

export const verifyUrl = (number: string) => `verify.cipm.example/certificate/${encodeURIComponent(number)}`

/** Deterministic QR-style matrix (visual placeholder — not a scannable QR code). */
function qrCells(seed: string, n = 25) {
  let h = hashString(seed)
  const cells: [number, number][] = []
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y)) continue
      h = Math.imul(h ^ (x * 374761393 + y * 668265263), 1274126177) >>> 0
      if ((h >> 13) & 1) cells.push([x, y])
    }
  return { cells, n }
}

function Finder({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x * s} ${y * s})`}>
      <rect width={7 * s} height={7 * s} fill="#12264a" />
      <rect x={s} y={s} width={5 * s} height={5 * s} fill="#fff" />
      <rect x={2 * s} y={2 * s} width={3 * s} height={3 * s} fill="#12264a" />
    </g>
  )
}

export const CertificateView = forwardRef<SVGSVGElement, { data: CertificateData }>(function CertificateView({ data }, ref) {
  const { cells, n } = qrCells(data.number)
  const s = 4
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" className="h-auto w-full bg-white" role="img" aria-label={`Certificate of completion for ${data.studentName}`} fontFamily="Georgia, 'Times New Roman', serif">
      <rect width="1200" height="850" fill="#ffffff" />
      <rect x="28" y="28" width="1144" height="794" fill="none" stroke="#12264a" strokeWidth="6" />
      <rect x="44" y="44" width="1112" height="762" fill="none" stroke="#d97706" strokeWidth="1.5" />
      <rect x="28" y="28" width="1144" height="150" fill="#12264a" />
      <rect x="70" y="58" width="150" height="90" rx="10" fill="#ffffff" />
      <svg x="80" y="64" width="130" height="78" viewBox={CIPM_LOGO_VIEWBOX} dangerouslySetInnerHTML={{ __html: CIPM_LOGO_INNER }} />
      <text x="245" y="98" fill="#ffffff" fontSize="40" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="3">CIPM</text>
      <text x="245" y="128" fill="#b9cde9" fontSize="15" fontFamily="Arial, sans-serif" letterSpacing="4">LEARNING PORTAL · DEMO</text>
      <text x="600" y="270" textAnchor="middle" fill="#d97706" fontSize="20" letterSpacing="8" fontFamily="Arial, sans-serif">CERTIFICATE OF COMPLETION</text>
      <text x="600" y="335" textAnchor="middle" fill="#475569" fontSize="22" fontStyle="italic">This is to certify that</text>
      <text x="600" y="425" textAnchor="middle" fill="#12264a" fontSize={data.studentName.length > 28 ? 52 : 66} fontWeight="700">{data.studentName}</text>
      <line x1="300" y1="448" x2="900" y2="448" stroke="#cbd5e1" strokeWidth="1.5" />
      <text x="600" y="500" textAnchor="middle" fill="#475569" fontSize="22" fontStyle="italic">has successfully completed all eight modules of the programme</text>
      <text x="600" y="565" textAnchor="middle" fill="#12264a" fontSize={data.courseTitle.length > 40 ? 34 : 40} fontWeight="700">{data.courseTitle}</text>
      <text x="600" y="605" textAnchor="middle" fill="#64748b" fontSize="15" fontFamily="Arial, sans-serif">Demonstration certificate — issued by the CIPM LMS demo, not an official qualification.</text>

      <g transform="translate(110 650)">
        <text x="0" y="52" fill="#12264a" fontSize="30" fontStyle="italic">{data.signatoryName}</text>
        <line x1="0" y1="66" x2="280" y2="66" stroke="#12264a" strokeWidth="1.5" />
        <text x="0" y="88" fill="#475569" fontSize="14" fontFamily="Arial, sans-serif">{data.signatoryName}</text>
        <text x="0" y="108" fill="#64748b" fontSize="13" fontFamily="Arial, sans-serif">{data.signatoryTitle}</text>
      </g>
      <g transform="translate(470 640)" fontFamily="Arial, sans-serif" textAnchor="middle">
        <circle cx="130" cy="52" r="48" fill="#fff7ed" stroke="#d97706" strokeWidth="3" />
        <circle cx="130" cy="52" r="39" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" />
        <text x="130" y="49" fill="#b45309" fontSize="13" fontWeight="700" letterSpacing="2">CIPM</text>
        <text x="130" y="66" fill="#b45309" fontSize="10" letterSpacing="2">VERIFIED</text>
        <text x="130" y="124" fill="#475569" fontSize="14">Issued {formatLongDate(data.issuedAt)}</text>
        <text x="130" y="144" fill="#12264a" fontSize="14" fontWeight="700">No. {data.number}</text>
      </g>
      <g transform="translate(940 650)">
        <rect x="-8" y="-8" width={n * s + 16} height={n * s + 16} fill="#ffffff" stroke="#e2e8f0" />
        <Finder x={0} y={0} s={s} /><Finder x={n - 7} y={0} s={s} /><Finder x={0} y={n - 7} s={s} />
        {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill="#12264a" />)}
        <text x={(n * s) / 2} y={n * s + 26} textAnchor="middle" fill="#475569" fontSize="10.5" fontFamily="Arial, sans-serif">Scan to verify (simulated)</text>
        <text x={(n * s) / 2} y={n * s + 40} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="Arial, sans-serif">{verifyUrl(data.number).slice(0, 44)}</text>
      </g>
    </svg>
  )
})

export function downloadCertificateSvg(svg: SVGSVGElement, number: string) {
  const xml = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `certificate-${number.replace(/[^\w-]+/g, '_')}.svg`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
