"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { candidateApi } from '@/services/api'
import type { Candidate } from '@/types'

// metadata cannot be exported from a client component

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [skills, setSkills] = useState('')
    const [sector, setSector] = useState('')
    const [location, setLocation] = useState('')
    const [limit, setLimit] = useState<number>(10)

    const [results, setResults] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const [offset, setOffset] = useState<number | undefined>(undefined)

    const controllerRef = useRef<AbortController | null>(null)

    const reset = useCallback(() => {
        setQuery('')
        setSkills('')
        setSector('')
        setLocation('')
        setLimit(10)
        setResults([])
        setHasMore(false)
        setOffset(undefined)
        setError(null)
    }, [])

    const performSearch = useCallback(async (opts?: { append?: boolean }) => {
        if (controllerRef.current) controllerRef.current.abort()
        controllerRef.current = new AbortController()

        setLoading(true)
        setError(null)
        try {
            const resp = await candidateApi.searchEligible(query, limit, {
                skills: skills || undefined,
                sector: sector || undefined,
                location: location || undefined,
                offset,
            })
            setResults(prev => opts?.append ? [...prev, ...resp.candidates] : resp.candidates)
            setHasMore(Boolean(resp.nextOffset))
            setOffset(resp.nextOffset)
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setError((e as Error).message || 'Search failed')
            }
        } finally {
            setLoading(false)
        }
    }, [query, limit, skills, sector, location, offset])

    const onSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        setOffset(undefined)
        performSearch({ append: false })
    }, [performSearch])

    const loadMore = useCallback(() => {
        if (!hasMore || loading) return
        performSearch({ append: true })
    }, [hasMore, loading, performSearch])

    return (
        <main className="min-h-[70vh]">
            <section className="bg-background">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-3xl font-bold text-text">Search Candidates</h1>
                    <p className="mt-2 text-gray-600">Filter by skills, sector, and location</p>

                    <div className="mt-6 bg-white border rounded-lg p-6 shadow-sm">
                        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-4">
                            <div className="md:col-span-2">
                                <label htmlFor="q" className="block text-sm font-medium text-gray-700">Search query</label>
                                <input id="q" name="q" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. product manager, frontend developer" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                            </div>
                            <div>
                                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills</label>
                                <input id="skills" name="skills" type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Python" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                            </div>
                            <div>
                                <label htmlFor="sector" className="block text-sm font-medium text-gray-700">Sector</label>
                                <input id="sector" name="sector" type="text" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Fintech, Healthcare" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                                <input id="location" name="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, NYC" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                            </div>
                            <div>
                                <label htmlFor="limit" className="block text-sm font-medium text-gray-700">Number of candidates to fetch</label>
                                <input id="limit" name="limit" type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(parseInt(e.target.value || '10', 10))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
                            </div>
                            <div className="md:col-span-4 flex gap-3 items-end">
                                <Button type="submit" variant="primary" disabled={loading} className="flex items-center gap-2">
                                    {loading ? (<><Spinner size="sm" /> Searching...</>) : 'Search'}
                                </Button>
                                <Button type="button" variant="outline" onClick={reset} disabled={loading}>Reset</Button>
                            </div>
                        </form>
                    </div>

                    {error && (
                        <div className="mt-4">
                            <Alert type="error" title="Search failed">{error}</Alert>
                        </div>
                    )}

                    {/* Results */}
                    <div className="mt-6 space-y-4">
                        {results.map((c, idx) => (
                            <div key={`${c.id || idx}-${c.email || ''}`} className="bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text">
                                            {c.id ? (
                                                <a className="text-text hover:underline" href={`/candidates/${c.id}`}>{c.name || 'Candidate'}</a>
                                            ) : (
                                                c.name || 'Candidate'
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600">{c.email || '—'} • {c.phone || '—'}</p>
                                        {(c.skills && c.skills.length > 0) && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {c.skills.map((s, i) => (
                                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{s}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-secondary text-white">Score: {Math.round(c.score)}</span>
                                    </div>
                                </div>
                                {(c.sector || c.location) && (
                                    <p className="text-sm text-gray-500 mt-2">{[c.sector, c.location].filter(Boolean).join(' • ')}</p>
                                )}
                            </div>
                        ))}

                        {results.length === 0 && !loading && !error && (
                            <p className="text-gray-500">No results yet. Try searching with filters.</p>
                        )}

                        {/* Load more */}
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <Button onClick={loadMore} variant="outline" disabled={loading} className="flex items-center gap-2">
                                    {loading ? (<><Spinner size="sm" /> Loading...</>) : 'Load more'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}


