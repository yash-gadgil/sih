import { apiClient } from '@/lib/api-client';
import { ApiResponse, User, PaginatedResponse, CVUploadResponse, CandidateSearchResponse, CandidateDetail } from '@/types';

// Example API service functions - customize based on your backend endpoints

// User-related API calls
export const userApi = {
  // Get all users
  getUsers: (): Promise<ApiResponse<User[]>> => {
    return apiClient.get<User[]>('/api/users');
  },

  // Get user by ID
  getUser: (id: string): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(`/api/users/${id}`);
  },

  // Create new user
  createUser: (userData: Omit<User, 'id'>): Promise<ApiResponse<User>> => {
    return apiClient.post<User>('/api/users', userData);
  },

  // Update user
  updateUser: (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.put<User>(`/api/users/${id}`, userData);
  },

  // Delete user
  deleteUser: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/api/users/${id}`);
  },

  // Get paginated users
  getUsersPaginated: (page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return apiClient.get<PaginatedResponse<User>>(`/api/users?page=${page}&limit=${limit}`);
  },
};

// Generic API service for common operations
export const genericApi = {
  // Health check
  healthCheck: (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    return apiClient.get<{ status: string; timestamp: string }>('/api/health');
  },

  // Upload file
  uploadFile: (file: File, endpoint: string = '/api/upload'): Promise<ApiResponse<{ url: string; filename: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post<{ url: string; filename: string }>(endpoint, formData, {
      'Content-Type': 'multipart/form-data',
    });
  },

  // Download file
  downloadFile: async (url: string, filename: string): Promise<void> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// CV Upload API
export const cvApi = {
  // Upload CV file
  uploadCV: async (file: File): Promise<CVUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${apiClient.getBaseURL()}/upload-cv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Upload failed with status ${response.status}`,
      }));
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  },
};

// Eligible candidates search API
export const candidateApi = {
  searchEligible: async (
    query: string,
    limit: number,
    extraFilters?: { skills?: string; sector?: string; location?: string; offset?: number }
  ): Promise<CandidateSearchResponse> => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (typeof limit === 'number') params.set('k', String(limit));
    if (extraFilters?.offset !== undefined) params.set('offset', String(extraFilters.offset));
    if (extraFilters?.skills) params.set('skills', extraFilters.skills);
    if (extraFilters?.sector) params.set('sector', extraFilters.sector);
    if (extraFilters?.location) params.set('location', extraFilters.location);

    // Use Next.js API route proxy to avoid CORS and unify origin
    const url = `/api/eligible-candidates?${params.toString()}`;
    let response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      // Retry with POST JSON in case backend expects body
      const body: Record<string, unknown> = { q: query, k: limit };
      if (extraFilters?.skills) body.skills = extraFilters.skills;
      if (extraFilters?.sector) body.sector = extraFilters.sector;
      if (extraFilters?.location) body.location = extraFilters.location;
      if (extraFilters?.offset !== undefined) body.offset = extraFilters.offset;

      response = await fetch('/api/eligible-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Search failed (${response.status})` }));
      throw new Error(errorData.message || 'Search failed');
    }

    return response.json();
  },
  getCandidate: async (id: string): Promise<CandidateDetail> => {
    // Use absolute backend URL (server-side fetch requires absolute URLs)
    const base = apiClient.getBaseURL();
    const url = `${base}/candidates/${encodeURIComponent(id)}`;
    try {
      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 404) {
          // Fallback: return minimal info so the page still shows a PDF link
          return {
            id,
            score: 0,
            pdfUrl: `${base}/pdf/${id}.pdf`,
            pdfId: id,
          } as unknown as CandidateDetail;
        }
        const errorData = await response.json().catch(() => ({ message: `Fetch failed (${response.status})` }));
        // On any other upstream error, degrade gracefully with minimal fields
        return {
          id,
          score: 0,
          pdfUrl: `${base}/pdf/${id}.pdf`,
          pdfId: id,
          // Include message for debugging surfaces if needed
          ...(errorData?.message ? { summary: `Upstream error: ${errorData.message}` } : {}),
        } as unknown as CandidateDetail;
      }
      return response.json();
    } catch (err) {
      // Network or parsing failure: degrade gracefully
      return {
        id,
        score: 0,
        pdfUrl: `${base}/pdf/${id}.pdf`,
        pdfId: id,
      } as unknown as CandidateDetail;
    }
  },
};

// Export the API client for direct use if needed
export { apiClient } from '@/lib/api-client';
