// Environment variable validation and helpers

interface EnvConfig {
  BASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  API_TIMEOUT?: number;
}

// Validate required environment variables
function validateEnv(): EnvConfig {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_BASE_URL is not set, using default: http://localhost:3001');
  }

  return {
    BASE_URL: baseUrl || 'http://localhost:3001',
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT 
      ? parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT, 10) 
      : undefined,
  };
}

// Export validated environment configuration
export const env = validateEnv();

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// API configuration helpers
export const getApiBaseUrl = (): string => env.BASE_URL;
export const getApiTimeout = (): number => env.API_TIMEOUT || 10000;

// Environment variable getter with fallback
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value || fallback || '';
}
