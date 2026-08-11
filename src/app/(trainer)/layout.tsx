'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Dumbbell, BookOpen, ClipboardList,
  Calendar, MessageSquare, BarChart3, Bell, Settings,
  LogOut, Menu, Moon, Sun, ChevronLeft, CircleHelp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { BrandMark } from '@/components/brand/brand-mark';

// A navegação é dividida entre o que se usa todo dia e o que se consulta de
// vez em quando. "Montar ficha" fica recuado sob "Fichas de treino" porque é
// a ação daquela seção, não um assunto separado.
const NAV_GROUPS = [
  {
    label: 'Operação',
    items: [
      { href: '/dashboard', label: 'Início', icon: LayoutDashboard, child: false },
      { href: '/students', label: 'Alunos', icon: Users, child: false },
      { href: '/workouts', label: 'Fichas de treino', icon: Dumbbell, child: false },
      { href: '/exercises', label: 'Montar ficha', icon: BookOpen, child: true },
      { href: '/schedule', label: 'Agenda', icon: Calendar, child: false },
      { href: '/messages', label: 'Mensagens', icon: MessageSquare, child: false },
    ],
  },
  {
    label: 'Análise',
    items: [
      { href: '/assessments', label: 'Avaliações', icon: ClipboardList, child: false },
      { href: '/reports', label: 'Relatórios', icon: BarChart3, child: false },
      { href: '/alerts', label: 'Alertas', icon: Bell, child: false },
    ],
  },
];

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/students', label: 'Alunos', icon: Users },
  { href: '/workouts', label: 'Fichas', icon: Dumbbell },
  { href: '/messages', label: 'Chat', icon: MessageSquare },
  { href: '/alerts', label: 'Alertas', icon: Bell },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { unread?: number };
        setUnreadAlerts(data.unread ?? 0);
      } catch {
        // O indicador não deve bloquear a navegação.
      }
    };
    void loadUnread();
    const interval = window.setInterval(loadUnread, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const renderNavContent = (mobile = false) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center ${collapsed && !mobile ? 'justify-center' : 'gap-3'} px-4 py-5`}>
        <BrandMark inverted compact={collapsed && !mobile} iconOnly={collapsed && !mobile} />
      </div>

      <Separator className="bg-white/10" />

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {(!collapsed || mobile) && (
                <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${active
                        ? 'bg-[#c9ff32] text-black shadow-[0_12px_28px_rgba(201,255,50,0.16)]'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                      }
                      ${collapsed && !mobile ? 'justify-center' : item.child ? 'ml-3' : ''}
                    `}
                  >
                    <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-black' : ''}`} />
                    {(!collapsed || mobile) && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.href === '/alerts' && unreadAlerts > 0 && <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] text-black">{unreadAlerts}</span>}
                      </>
                    )}
                  </Link>
                );

                if (collapsed && !mobile) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={link} />
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return link;
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/10" />

      {/* Footer */}
      <div className="px-3 py-3 space-y-1">
        <Link
          href="/help"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:bg-white/8 hover:text-white transition-colors ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <CircleHelp className="w-4.5 h-4.5 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Ajuda e tutoriais</span>}
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:bg-white/8 hover:text-white transition-colors
            ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <Settings className="w-4.5 h-4.5 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Configurações</span>}
        </Link>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:bg-white/8 hover:text-white transition-colors w-full
            ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          {(!collapsed || mobile) && <span>{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        <Separator className="my-2 bg-white/10" />

        <div className={`flex items-center ${collapsed && !mobile ? 'justify-center' : 'gap-3'} px-3 py-2`}>
          <Avatar className="w-8 h-8 flex-shrink-0">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={`Avatar de ${user.name}`} />}
            <AvatarFallback className="bg-[#c9ff32] text-black text-xs font-black">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || mobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Personal'}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">Personal</p>
            </div>
          )}
          {(!collapsed || mobile) && (
            <Tooltip>
              <TooltipTrigger render={<button onClick={handleLogout} className="text-white/60 hover:text-[#c9ff32] transition-colors" />}>
                <LogOut className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dk-app flex h-screen overflow-hidden bg-[#090a08]">
      {/* Desktop Sidebar */}
      <aside className={`relative hidden lg:flex flex-col border-r border-white/10 bg-[#090a08] text-white transition-all duration-300
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        {renderNavContent()}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 w-6 h-6 rounded-full border border-black bg-[#c9ff32] shadow-sm flex items-center justify-center text-black hover:scale-105 z-50 hidden lg:flex transition-transform"
          style={{ left: collapsed ? '60px' : '248px' }}
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#090a08]/95 text-white backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10 hover:text-white" />}>
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-white/10 bg-[#090a08] p-0 text-white">
              {renderNavContent(true)}
            </SheetContent>
          </Sheet>
          <BrandMark compact inverted />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 relative text-white hover:bg-white/10 hover:text-white" onClick={() => router.push('/alerts')}>
            <Bell className="w-4.5 h-4.5" />
            {unreadAlerts > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-destructive" />}
          </Button>
          <Avatar className="w-8 h-8">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={`Avatar de ${user.name}`} />}
            <AvatarFallback className="bg-[#c9ff32] text-black text-xs font-black">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <main className="dk-app-surface flex-1 overflow-y-auto pt-16 pb-20 lg:pt-0 lg:pb-0">
        <div className="relative z-10 mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090a08]/95 text-white backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-16 px-2">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors relative
                  ${active ? 'text-[#c9ff32]' : 'text-white/60'}`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-[#c9ff32]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute -top-0.5 w-5 h-0.5 bg-[#c9ff32] rounded-full shadow-[0_0_12px_rgba(201,255,50,0.7)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
