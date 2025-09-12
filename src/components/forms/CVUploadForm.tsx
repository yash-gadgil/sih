'use client';

import React, { useState } from 'react';
import { cvApi } from '@/services/api';
import { CVUploadResponse } from '@/types';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

const CVUploadForm: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<CVUploadResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
                setError(null);
                setUploadResult(null);
            } else {
                setError('Please select a PDF file');
                setFile(null);
            }
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
                setError(null);
                setUploadResult(null);
            } else {
                setError('Please select a PDF file');
                setFile(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError('Please select a PDF file');
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadResult(null);

        try {
            const result = await cvApi.uploadCV(file);
            setUploadResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setError(null);
        setUploadResult(null);
        setIsUploading(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload CV (PDF only)
                    </label>
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                                ? 'border-primary bg-primary/5'
                                : file
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                        />
                        <div className="space-y-2">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                            >
                                <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div className="text-sm text-gray-600">
                                {file ? (
                                    <span className="text-green-600 font-medium">{file.name}</span>
                                ) : (
                                    <>
                                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">PDF files only, max 10MB</p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <Alert type="error" title="Upload Error">
                        {error}
                    </Alert>
                )}

                {/* Success Message */}
                {uploadResult?.success && (
                    <Alert type="success" title="Upload Successful">
                        {uploadResult.message}
                    </Alert>
                )}

                {/* Metadata Display */}
                {uploadResult?.metadata && (
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Information</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {uploadResult.metadata.name && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Name:</span>
                                    <p className="text-sm text-gray-900">{uploadResult.metadata.name}</p>
                                </div>
                            )}
                            {uploadResult.metadata.email && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Email:</span>
                                    <p className="text-sm text-gray-900">{uploadResult.metadata.email}</p>
                                </div>
                            )}
                            {uploadResult.metadata.phone && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                                    <p className="text-sm text-gray-900">{uploadResult.metadata.phone}</p>
                                </div>
                            )}
                            {uploadResult.metadata.experience && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Experience:</span>
                                    <p className="text-sm text-gray-900">{uploadResult.metadata.experience}</p>
                                </div>
                            )}
                            {uploadResult.metadata.skills && uploadResult.metadata.skills.length > 0 && (
                                <div className="sm:col-span-2">
                                    <span className="text-sm font-medium text-gray-500">Skills:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {uploadResult.metadata.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!file || isUploading}
                        className="flex items-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Spinner size="sm" />
                                Uploading...
                            </>
                        ) : (
                            'Upload CV'
                        )}
                    </Button>

                    {(file || uploadResult) && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            disabled={isUploading}
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CVUploadForm;
