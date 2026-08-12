'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, ChevronLeft, ChevronRight, CircleHelp, Dumbbell, LayoutDashboard, LogOut, Menu, Moon, Sun, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

const NAVIGATION = [
  { href: '/my', label: 'Visão geral', short: 'Início', icon: LayoutDashboard },
  { href: '/my-exercises', label: 'Montar ficha', short: 'Montar', icon: BookOpen },
  { href: '/my-plans', label: 'Minhas fichas', short: 'Fichas', icon: Dumbbell },
  { href: '/my-profile', label: 'Meu perfil', short: 'Perfil', icon: UserRound },
];

export default function IndividualLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => href === '/my' ? pathname === '/my' : pathname.startsWith(href);
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'GK';

  async function handleLogout() {
    await logout();
    router.replace('/login');
    router.refresh();
  }

  const navigation = (mobile = false) => (
    // A gaveta cobre a tela toda, então no celular ela também nasce atrás da
    // barra de status. Na barra lateral do desktop não há faixa a devolver.
    <div className={`flex h-full min-h-0 flex-col overflow-hidden${mobile ? ' dk-safe-top' : ''}`}>
      <div className={`flex shrink-0 items-center ${collapsed && !mobile ? 'justify-center' : 'gap-3'} px-4 py-5`}>
        <BrandMark inverted compact={collapsed && !mobile} iconOnly={collapsed && !mobile} />
      </div>
      <Separator className="bg-white/10" />
      <ScrollArea className="min-h-0 flex-1 px-3 py-5">
        {(!collapsed || mobile) && <div className="mb-5 rounded-2xl border border-[#c9ff32]/25 bg-[#c9ff32]/8 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c9ff32]">Área individual</p><p className="mt-2 text-xs leading-5 text-white/60">Seu treino, suas fichas e seu perfil. Sem recursos de personal.</p></div>}
        <nav className="space-y-1" aria-label="Navegação da conta individual">
          {NAVIGATION.map((item) => {
            const active = isActive(item.href);
            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobile && setMobileOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${active ? 'bg-[#c9ff32] text-black shadow-[0_12px_28px_rgba(201,255,50,0.14)]' : 'text-white/65 hover:bg-white/8 hover:text-white'} ${collapsed && !mobile ? 'justify-center' : ''}`}
              >
                <item.icon className="size-[18px] shrink-0" />
                {(!collapsed || mobile) && <span>{item.label}</span>}
              </Link>
            );
            return collapsed && !mobile ? <Tooltip key={item.href}><TooltipTrigger render={link} /><TooltipContent side="right">{item.label}</TooltipContent></Tooltip> : link;
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-white/10" />
      <div className="shrink-0 space-y-1 px-3 py-3">
        <Link href="/help" className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/65 hover:bg-white/8 hover:text-white ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <CircleHelp className="size-[18px]" />{(!collapsed || mobile) && <span>Ajuda e tutoriais</span>}
        </Link>
        <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/65 hover:bg-white/8 hover:text-white ${collapsed && !mobile ? 'justify-center' : ''}`}>
          {resolvedTheme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}{(!collapsed || mobile) && <span>{resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>}
        </button>
        <Separator className="my-2 bg-white/10" />
        <div className={`flex items-center ${collapsed && !mobile ? 'justify-center' : 'gap-3'} px-3 py-2`}>
          <Avatar className="size-9 shrink-0 ring-2 ring-[#c9ff32]/25">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={`Avatar de ${user.name}`} />}
            <AvatarFallback className="bg-[#c9ff32] text-xs font-black text-black">{initials}</AvatarFallback>
          </Avatar>
          {(!collapsed || mobile) && <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{user?.name || 'Atleta'}</p><p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#c9ff32]">Independente</p></div>}
          {(!collapsed || mobile) && <button type="button" aria-label="Sair da conta" title="Sair" onClick={() => void handleLogout()} className="text-white/40 transition-colors hover:text-[#c9ff32]"><LogOut className="size-4" /></button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dk-app flex h-screen overflow-hidden bg-[#090a08]">
      <aside className={`relative z-30 hidden min-h-0 overflow-visible border-r border-white/10 bg-[#090a08] text-white transition-all duration-300 lg:flex lg:flex-col ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        {navigation()}
        <button onClick={() => setCollapsed((value) => !value)} className="absolute -right-5 top-20 z-30 hidden size-11 items-center justify-center rounded-2xl border-2 border-[#c9ff32] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-transform hover:scale-105 lg:flex" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>
          {collapsed ? <ChevronRight className="size-5 text-black" /> : <ChevronLeft className="size-5 text-black" />}
        </button>
      </aside>

      <header className="dk-app-header fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#090a08]/95 px-4 text-white backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="size-10 text-white hover:bg-white/10 hover:text-white" />}><Menu className="size-5" /></SheetTrigger>
            <SheetContent side="left" className="w-[290px] border-white/10 bg-[#090a08] p-0 text-white">{navigation(true)}</SheetContent>
          </Sheet>
          <BrandMark compact inverted />
        </div>
        <Avatar className="size-9 ring-2 ring-[#c9ff32]/25">{user?.avatar_url && <AvatarImage src={user.avatar_url} alt={`Avatar de ${user.name}`} />}<AvatarFallback className="bg-[#c9ff32] text-xs font-black text-black">{initials}</AvatarFallback></Avatar>
      </header>

      <main className="dk-app-surface dk-app-header-offset flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="relative z-10 mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 xl:p-10">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#090a08]/95 text-white backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex h-16 items-center justify-around px-1">
          {NAVIGATION.map((item) => {
            const active = isActive(item.href);
            return <Link key={item.href} href={item.href} className={`relative flex min-h-12 min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 ${active ? 'text-[#c9ff32]' : 'text-white/60'}`}><item.icon className="size-5" /><span className="text-[10px] font-medium">{item.short}</span>{active && <span className="absolute -top-0.5 h-0.5 w-5 rounded-full bg-[#c9ff32]" />}</Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
