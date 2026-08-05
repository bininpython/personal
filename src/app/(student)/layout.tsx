'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Dumbbell, History, TrendingUp, Trophy,
  MessageSquare, User, LogOut, Moon, Sun, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { APP_NAME } from '@/constants';
import { useEffect, useState } from 'react';

const BOTTOM_NAV = [
  { href: '/home', label: 'Início', icon: Home },
  { href: '/workout', label: 'Treino', icon: Dumbbell },
  { href: '/history', label: 'Histórico', icon: History },
  { href: '/progress', label: 'Evolução', icon: TrendingUp },
  { href: '/profile', label: 'Perfil', icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    if (pathname === '/onboarding') {
      setChecking(false);
      return;
    }

    const checkProfile = async () => {
      try {
        const res = await fetch(`/api/students/${user.id}`);
        if (res.ok) {
          const { student } = await res.json();
          if (!student.height || !student.current_weight || student.height === 0 || student.current_weight === 0) {
            router.push('/onboarding');
            return;
          }
        }
      } catch (err) {
        console.error('Error checking profile', err);
      } finally {
        setChecking(false);
      }
    };

    checkProfile();
  }, [user, pathname, router]);

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (checking && pathname !== '/onboarding') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If we are on onboarding page, we don't need the header and bottom nav
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
                  {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xs font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AL'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-2">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors relative
                  ${active ? 'text-blue-500' : 'text-muted-foreground'}`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-blue-500' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute -top-0.5 w-5 h-0.5 bg-blue-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
