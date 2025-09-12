import { NextResponse } from 'next/server'

function normalize(data: any, origin: string, id: string) {
  if (!data || typeof data !== 'object') return { id, score: 0, pdfUrl: `${origin}/pdf/${id}.pdf` }
  const pdfId = data.pdfId || data.pdf_id || id
  const pdfUrl = `${origin}/pdf/${pdfId}.pdf`
  return { ...data, pdfId, pdfUrl }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:5000'
  const target = `${base}/candidates/${encodeURIComponent(params.id)}`
  try {
    const resp = await fetch(target, { cache: 'no-store' })
    const raw = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      const message = (raw && (raw.message || raw.error)) || `Upstream error (${resp.status})`
      return NextResponse.json({ message, base, target, status: resp.status }, { status: resp.status })
    }
    return NextResponse.json(normalize(raw, base, params.id))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch upstream'
    return NextResponse.json({ message, base, target }, { status: 502 })
  }
}
