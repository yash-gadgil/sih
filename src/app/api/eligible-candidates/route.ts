import { NextResponse } from 'next/server'

function normalize(data: any) {
    const candidates = data?.candidates ?? data?.eligible ?? data?.results ?? data?.data ?? []
    const total = data?.total ?? (Array.isArray(candidates) ? candidates.length : undefined)
    const nextOffset = data?.nextOffset ?? undefined
    return { candidates, total, nextOffset }
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:5000'
    const target = `${base}/eligible-candidates?${url.searchParams.toString()}`

    try {
        const resp = await fetch(target, { cache: 'no-store' })
        const raw = await resp.json().catch(() => ({}))

        if (!resp.ok) {
            const message = (raw && (raw.message || raw.error)) || `Upstream error (${resp.status})`
            return NextResponse.json({ message, base, target, status: resp.status }, { status: resp.status })
        }

        return NextResponse.json(normalize(raw))
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch upstream'
        return NextResponse.json({ message, base, target }, { status: 502 })
    }
}

export async function POST(request: Request) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:5000'
    const target = `${base}/eligible-candidates`
    let payload: unknown
    try {
        payload = await request.json()
    } catch {
        payload = undefined
    }

    try {
        const resp = await fetch(target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload ? JSON.stringify(payload) : undefined,
        })
        const raw = await resp.json().catch(() => ({}))

        if (!resp.ok) {
            const message = (raw && (raw.message || raw.error)) || `Upstream error (${resp.status})`
            return NextResponse.json({ message, base, target, status: resp.status }, { status: resp.status })
        }

        return NextResponse.json(normalize(raw))
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch upstream'
        return NextResponse.json({ message, base, target }, { status: 502 })
    }
}


