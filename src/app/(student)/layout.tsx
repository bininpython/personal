'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Dumbbell, History, TrendingUp,
  User, LogOut, MessageSquare, Moon, Sun, CircleHelp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { BrandMark } from '@/components/brand/brand-mark';
import { useEffect, useState } from 'react';

const BOTTOM_NAV = [
  { href: '/home', label: 'Início', icon: Home },
  { href: '/workout', label: 'Treino', icon: Dumbbell },
  { href: '/history', label: 'Histórico', icon: History },
  { href: '/progress', label: 'Evolução', icon: TrendingUp },
  { href: '/student-messages', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Perfil', icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isOnboarding = pathname === '/onboarding';
  const [checking, setChecking] = useState(!isOnboarding);

  useEffect(() => {
    if (!user?.id || isOnboarding) return;
    let active = true;

    const checkProfile = async () => {
      try {
        const res = await fetch(`/api/students/${user.id}`);
        if (res.ok) {
          const { student } = await res.json();
          if (!student.privacy_consent_at) {
            router.push('/onboarding');
            return;
          }
        }
      } catch (err) {
        console.error('Error checking profile', err);
      } finally {
        if (active) setChecking(false);
      }
    };

    void checkProfile();
    return () => {
      active = false;
    };
  }, [user?.id, isOnboarding, router]);

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
    router.refresh();
  };

  if (checking && !isOnboarding) {
    return (
      <div className="dk-app dk-app-surface flex h-screen items-center justify-center">
        <div className="size-9 animate-spin rounded-full border-4 border-[#c9ff32] border-t-black" />
      </div>
    );
  }

  // If we are on onboarding page, we don't need the header and bottom nav
  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="dk-app flex min-h-screen flex-col bg-[#090a08]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a08]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark compact inverted />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação do aluno">
            {BOTTOM_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${active ? 'bg-[#c9ff32] text-black' : 'text-white/70 hover:bg-white/8 hover:text-white'}`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => router.push('/help')} />}>
                <CircleHelp className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>Ajuda e tutoriais</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} />}>
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </TooltipTrigger>
              <TooltipContent>{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" className="hidden h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white sm:inline-flex" onClick={handleLogout} />}>
                <LogOut className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
            <div className="ml-1 hidden text-right xl:block">
              <p className="max-w-28 truncate text-xs font-bold">{user?.name || 'Aluno'}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">Atleta D KONG</p>
            </div>
            <Avatar className="w-9 h-9 ring-2 ring-[#c9ff32]/30">
              {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={`Avatar de ${user.name}`} />}
              <AvatarFallback className="bg-[#c9ff32] text-black text-xs font-black">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AL'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dk-app-surface flex-1 pb-24 lg:pb-0">
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#090a08]/95 text-white backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-1">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-12 min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-colors
                  ${active ? 'text-[#c9ff32]' : 'text-white/65'}`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-[#c9ff32]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute -top-0.5 h-0.5 w-5 rounded-full bg-[#c9ff32] shadow-[0_0_12px_rgba(201,255,50,0.7)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
