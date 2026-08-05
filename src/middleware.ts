// ============================================
// FitControl Pro — Next.js Middleware
// Protects trainer and student routes
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

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
const STUDENT_PATHS = ['/home', '/workout', '/history', '/progress', '/student-assessments', '/anatomy', '/achievements', '/student-messages', '/profile', '/onboarding'];

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

  // Execute Supabase middleware to refresh tokens and get response
  const { response, user } = await updateSession(request);

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = user.user_metadata?.role || 'student';

  // Check access based on role
  const isTrainerPath = TRAINER_PATHS.some(p => pathname.startsWith(p));
  const isStudentPath = STUDENT_PATHS.some(p => pathname.startsWith(p));

  if (isTrainerPath && role !== 'trainer') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (isStudentPath && role !== 'student') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
