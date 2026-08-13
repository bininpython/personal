import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-types';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/login/trainer',
  '/login/student',
  '/login/individual',
  '/register',
  '/register/individual',
  '/plans',
  '/terms',
  '/privacy',
  '/recover',
  '/help',
  '/icon',
  '/opengraph-image',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
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
  '/manifest.webmanifest',
]);

// A tela de offline responde igual para todo mundo, logado ou não. Ela não
// pode entrar em PUBLIC_PATHS: de lá quem tem sessão seria redirecionado para
// o painel, e o service worker acabaria guardando o HTML do painel sob a chave
// `/offline` ao pré-cachear a página na instalação.
const ALWAYS_PUBLIC_PATHS = new Set(['/offline']);

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

const INDIVIDUAL_PATHS = [
  '/my',
  '/my-plans',
  '/my-exercises',
  '/my-profile',
];

function roleHome(role: 'trainer' | 'student' | 'individual' | undefined) {
  if (role === 'trainer') return '/dashboard';
  if (role === 'individual') return '/my';
  return '/home';
}

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const role = session?.role;

  if (pathname.startsWith('/avatars/') || METADATA_PATHS.has(pathname) || ALWAYS_PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (session?.sub && pathname !== '/' && pathname !== '/help') {
      return NextResponse.redirect(new URL(roleHome(role), request.url));
    }
    return NextResponse.next();
  }

  if (!session?.sub) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isTrainerPath = TRAINER_PATHS.some((route) => matchesRoute(pathname, route));
  const isStudentPath = STUDENT_PATHS.some((route) => matchesRoute(pathname, route));
  const isIndividualPath = INDIVIDUAL_PATHS.some((route) => matchesRoute(pathname, route));

  if (isTrainerPath && role !== 'trainer') {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  if (isStudentPath && role !== 'student') {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  if (isIndividualPath && role !== 'individual') {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
