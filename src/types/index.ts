// Global type definitions for the application

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ErrorResponse {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// API Request/Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  field?: string;
  details?: Record<string, unknown>;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// CV Upload types
export interface CVUploadResponse {
  success: boolean;
  message: string;
  metadata?: {
    email?: string;
    phone?: string;
    name?: string;
    skills?: string[];
    experience?: string;
  };
  fileId?: string;
}

export interface CVUploadRequest {
  file: File;
}

// Candidate search types
export interface Candidate {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  score: number;
  skills?: string[];
  sector?: string;
  location?: string;
  pdfId?: string;
  pdfUrl?: string;
}

export interface CandidateSearchResponse {
  candidates: Candidate[];
  total?: number;
  nextOffset?: number;
}

export interface CandidateDetail extends Candidate {
  summary?: string;
  education?: Array<{
    institution?: string;
    degree?: string;
    startDate?: string;
    endDate?: string;
  }>;
  experience?: Array<{
    company?: string;
    role?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    link?: string;
  }>;
}

// Add more types as needed for your specific application
