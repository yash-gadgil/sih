// Application constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
} as const;

export const APP_CONFIG = {
  name: 'PM Internship Frontend',
  version: '1.0.0',
  description: 'Frontend application for PM Internship project',
} as const;
