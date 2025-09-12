import Link from 'next/link'

export default function Home() {
    return (
        <main>
            {/* Hero Section */}
            <section className="bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text">
                            Find the right candidate or get your CV noticed
                        </h1>
                        <p className="mt-4 text-lg text-gray-600">
                            A professional platform to upload CVs and search top candidates. Built with Next.js, TypeScript, and Tailwind CSS.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            <Link href="/upload" className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                                Upload CV
                            </Link>
                            <Link href="/search" className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white bg-secondary hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
                                Search Candidates
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
