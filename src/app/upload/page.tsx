import React from 'react'
import CVUploadForm from '@/components/forms/CVUploadForm'

export const metadata = {
    title: 'Upload CV | PM Internship',
}

export default function UploadPage() {
    return (
        <main className="min-h-[70vh]">
            <section className="bg-background">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-text">Upload your CV</h1>
                        <p className="mt-2 text-gray-600">
                            Upload your PDF CV to extract contact information and skills
                        </p>
                    </div>

                    <CVUploadForm />
                </div>
            </section>
        </main>
    )
}


