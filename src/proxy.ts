import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-types';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/login/trainer',
  '/login/student',
  '/register',
  '/plans',
  '/terms',
  '/privacy',
  '/recover',
  '/help',
]);

// Arquivos de metadata gerados pelo Next. Precisam responder ao rastreador e
// à prévia do WhatsApp sem sessão — e sem serem desviados para o painel
// quando quem pede está logado.
const METADATA_PATHS = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
  '/twitter-image',
  '/apple-icon',
  '/icon',
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
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const role = session?.role;

  if (pathname.startsWith('/avatars/') || METADATA_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (session?.sub && pathname !== '/' && pathname !== '/help') {
      const destination = role === 'trainer' ? '/dashboard' : '/home';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (!session?.sub) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
