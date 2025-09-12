import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    const target = `${base}/eligible-candidates?${url.searchParams.toString()}`

    try {
        const resp = await fetch(target, { cache: 'no-store' })
        const data = await resp.json().catch(() => ({}))

        if (!resp.ok) {
            const message = (data && (data.message || data.error)) || `Upstream error (${resp.status})`
            return NextResponse.json({ message, base, target, status: resp.status }, { status: resp.status })
        }

        return NextResponse.json(data)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch upstream'
        return NextResponse.json({ message, base, target }, { status: 502 })
    }
}

export async function POST(request: Request) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
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
        const data = await resp.json().catch(() => ({}))

        if (!resp.ok) {
            const message = (data && (data.message || data.error)) || `Upstream error (${resp.status})`
            return NextResponse.json({ message, base, target, status: resp.status }, { status: resp.status })
        }

        return NextResponse.json(data)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch upstream'
        return NextResponse.json({ message, base, target }, { status: 502 })
    }
}


