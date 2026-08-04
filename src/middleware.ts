// ============================================
// FitControl Pro — Next.js Middleware
// Protects trainer and student routes
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/login/trainer',
  '/login/student',
  '/register',
  '/plans',
  '/terms',
  '/privacy',
];

const TRAINER_PATHS = ['/dashboard', '/students', '/workouts', '/exercises', '/assessments', '/schedule', '/messages', '/reports', '/alerts', '/settings', '/subscription'];
const STUDENT_PATHS = ['/home', '/workout', '/history', '/progress', '/student-assessments', '/anatomy', '/achievements', '/student-messages', '/profile'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, API routes, and static files
  if (
    PUBLIC_PATHS.some(p => pathname === p) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session token
  const token = request.cookies.get('fitcontrol-session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const payload = await verifyToken(token);
  if (!payload) {
    // Invalid/expired token, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('fitcontrol-session');
    return response;
  }

  // Check access based on role
  const isTrainerPath = TRAINER_PATHS.some(p => pathname.startsWith(p));
  const isStudentPath = STUDENT_PATHS.some(p => pathname.startsWith(p));

  if (isTrainerPath && payload.role !== 'trainer') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (isStudentPath && payload.role !== 'student') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
