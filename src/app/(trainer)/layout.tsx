'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Dumbbell, BookOpen, ClipboardList,
  Calendar, MessageSquare, BarChart3, Bell, Settings,
  LogOut, Menu, X, Moon, Sun, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { APP_NAME } from '@/constants';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Alunos', icon: Users },
  { href: '/workouts', label: 'Fichas de Treino', icon: Dumbbell },
  { href: '/exercises', label: 'Exercícios', icon: BookOpen },
  { href: '/assessments', label: 'Avaliações', icon: ClipboardList },
  { href: '/schedule', label: 'Agenda', icon: Calendar },
  { href: '/messages', label: 'Mensagens', icon: MessageSquare, badge: 2 },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/alerts', label: 'Alertas', icon: Bell, badge: 3 },
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center ${collapsed && !mobile ? 'justify-center' : 'gap-3'} px-4 py-5`}>
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">{APP_NAME}</h2>
            <p className="text-xs text-muted-foreground truncate">Painel do Personal</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobile && setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                  ${collapsed && !mobile ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                {(!collapsed || mobile) && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 h-5 min-w-5 flex items-center justify-center">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && !mobile && item.badge && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
                )}
              </Link>
            );

            if (collapsed && !mobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-3 space-y-1">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors
            ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <Settings className="w-4.5 h-4.5 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Configurações</span>}
        </Link>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full
            ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          {(!collapsed || mobile) && <span>{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        <Separator className="my-2" />

        <div className={`flex items-center ${collapsed && !mobile ? 'justify-center' : 'gap-3'} px-3 py-2`}>
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || mobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name || 'Personal'}</p>
              <p className="text-xs text-muted-foreground">Personal Trainer</p>
            </div>
          )}
          {(!collapsed || mobile) && (
            <Tooltip>
              <TooltipTrigger>
                <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 w-6 h-6 rounded-full border bg-background shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground z-50 hidden lg:flex transition-colors"
          style={{ left: collapsed ? '60px' : '248px' }}
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background/80 backdrop-blur-lg border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <NavContent mobile />
            </SheetContent>
          </Sheet>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => router.push('/alerts')}>
            <Bell className="w-4.5 h-4.5" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PT'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14 pb-20 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors relative
                  ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute -top-0.5 w-5 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
