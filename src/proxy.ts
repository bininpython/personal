import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/login/trainer',
  '/login/student',
  '/register',
  '/plans',
  '/terms',
  '/privacy',
]);

const TRAINER_PATHS = [
  '/dashboard',
  '/students',
  '/workouts',
  '/exercises',
  '/assessments',
  '/schedule',
  '/messages',
  '/reports',
  '/alerts',
  '/settings',
  '/subscription',
];

const STUDENT_PATHS = [
  '/home',
  '/workout',
  '/history',
  '/progress',
  '/student-assessments',
  '/anatomy',
  '/achievements',
  '/student-messages',
  '/profile',
  '/onboarding',
];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, claims } = await updateSession(request);
  const appMetadata = claims?.app_metadata as { role?: string } | undefined;
  const userMetadata = claims?.user_metadata as { role?: string } | undefined;
  const role = appMetadata?.role || userMetadata?.role;

  if (PUBLIC_PATHS.has(pathname)) {
    if (claims?.sub && pathname !== '/') {
      const destination = role === 'trainer' ? '/dashboard' : '/home';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return response;
  }

  if (!claims?.sub) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isTrainerPath = TRAINER_PATHS.some((route) => matchesRoute(pathname, route));
  const isStudentPath = STUDENT_PATHS.some((route) => matchesRoute(pathname, route));

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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
