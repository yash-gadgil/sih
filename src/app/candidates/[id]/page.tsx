import type { Metadata } from 'next'
import Link from 'next/link'
import { candidateApi } from '@/services/api'
import type { CandidateDetail } from '@/types'

type PageProps = { params: { id: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    return { title: `Candidate ${params.id} | PM Internship` }
}

async function getData(id: string): Promise<CandidateDetail> {
    return candidateApi.getCandidate(id)
}

export default async function CandidatePage({ params }: PageProps) {
    const candidate = await getData(params.id)

    return (
        <main className="min-h-[70vh]">
            <section className="bg-background">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-6">
                        <Link href="/search" className="text-primary hover:underline">← Back to search</Link>
                    </div>

                    <div className="bg-white border rounded-lg p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-text">{candidate.name || 'Candidate'}</h1>
                                <p className="text-sm text-gray-600 mt-1">{candidate.email || '—'} • {candidate.phone || '—'}</p>
                                {(candidate.sector || candidate.location) && (
                                    <p className="text-sm text-gray-500 mt-1">{[candidate.sector, candidate.location].filter(Boolean).join(' • ')}</p>
                                )}
                            </div>
                            <div className="ml-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-secondary text-white">Score: {Math.round(candidate.score)}</span>
                            </div>
                        </div>

                        {candidate.summary && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold text-text">Summary</h2>
                                <p className="text-gray-700 mt-2 whitespace-pre-line">{candidate.summary}</p>
                            </div>
                        )}

                        {candidate.skills && candidate.skills.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold text-text">Skills</h2>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {candidate.skills.map((s, i) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {candidate.experience && candidate.experience.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold text-text">Experience</h2>
                                <div className="mt-2 space-y-3">
                                    {candidate.experience.map((exp, i) => (
                                        <div key={i} className="border rounded-md p-3">
                                            <p className="font-medium text-text">{exp.role || 'Role'}{exp.company ? ` • ${exp.company}` : ''}</p>
                                            {(exp.startDate || exp.endDate) && (
                                                <p className="text-xs text-gray-500">{[exp.startDate, exp.endDate].filter(Boolean).join(' — ')}</p>
                                            )}
                                            {exp.description && (
                                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {candidate.education && candidate.education.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold text-text">Education</h2>
                                <div className="mt-2 space-y-3">
                                    {candidate.education.map((ed, i) => (
                                        <div key={i} className="border rounded-md p-3">
                                            <p className="font-medium text-text">{ed.degree || 'Degree'}{ed.institution ? ` • ${ed.institution}` : ''}</p>
                                            {(ed.startDate || ed.endDate) && (
                                                <p className="text-xs text-gray-500">{[ed.startDate, ed.endDate].filter(Boolean).join(' — ')}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {candidate.projects && candidate.projects.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold text-text">Projects</h2>
                                <div className="mt-2 space-y-3">
                                    {candidate.projects.map((p, i) => (
                                        <div key={i} className="border rounded-md p-3">
                                            <p className="font-medium text-text">{p.name || 'Project'}</p>
                                            {p.link && (
                                                <p className="text-sm"><a href={p.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">{p.link}</a></p>
                                            )}
                                            {p.description && (
                                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{p.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}


