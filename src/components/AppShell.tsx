'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, MonitorPlay, TriangleAlert, Map, Ambulance, ListChecks,
  Send, Bell, Radio, Network, ScrollText, Play, Settings, HelpCircle,
  Search, Menu, LogOut, Wifi, WifiOff, ChevronLeft, Plus, Command as CmdIcon,
} from 'lucide-react';
import { useOps, api } from '@/lib/client/store';
import { ROLE_LABEL } from '@/lib/ui';
import { Logo } from './Logo';
import { CommandPalette } from './CommandPalette';
import { NotificationCenter } from './NotificationCenter';

interface Me { id: string; name: string; role: string; agency: { name: string; color: string } | null; avatarColor: string; }

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: any; badge?: 'gaps' | 'active' | 'acks' }[] }[] = [
  {
    label: 'Operations',
    items: [
      { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
      { href: '/situation-room', label: 'Situation Room', icon: MonitorPlay },
      { href: '/map', label: 'Operational Map', icon: Map },
    ],
  },
  {
    label: 'Response',
    items: [
      { href: '/incidents', label: 'Incidents', icon: TriangleAlert, badge: 'active' },
      { href: '/resources', label: 'Resources', icon: Ambulance },
      { href: '/tasks', label: 'Tasks', icon: ListChecks },
      { href: '/communications', label: 'Communications', icon: Send, badge: 'acks' },
    ],
  },
  {
    label: 'Awareness',
    items: [
      { href: '/alerts', label: 'Alerts & Gaps', icon: Bell, badge: 'gaps' },
      { href: '/reports', label: 'Field Reports', icon: Radio },
      { href: '/agencies', label: 'Agencies', icon: Network },
      { href: '/audit', label: 'Audit Trail', icon: ScrollText },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/demo', label: 'Demo Control', icon: Play },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/help', label: 'Help', icon: HelpCircle },
    ],
  },
];

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/situation-room', label: 'Situation', icon: MonitorPlay },
  { href: '/incidents', label: 'Incidents', icon: TriangleAlert },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, connected } = useOps();
  const [me, setMe] = useState<Me | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => j && setMe(j.data)).catch(() => {});
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  // Keyboard-first operations
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault(); setPaletteOpen(true); return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, string> = { c: '/incidents', r: '/resources', m: '/map', a: '/alerts', t: '/tasks', s: '/situation-room', d: '/dashboard' };
      if (map[e.key.toLowerCase()]) { e.preventDefault(); router.push(map[e.key.toLowerCase()]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const logout = useCallback(async () => { await api('/api/auth/logout'); router.push('/login'); }, [router]);

  const stats = state?.stats;
  const badgeVal = (b?: string) => {
    if (!stats) return undefined;
    if (b === 'gaps') return (stats.openGaps || 0) + (stats.openAlerts || 0) || undefined;
    if (b === 'active') return stats.activeIncidents || undefined;
    if (b === 'acks') return stats.pendingAcks || undefined;
    return undefined;
  };

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar (desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line/70 bg-surface/95 backdrop-blur transition-all duration-200 lg:static ${collapsed ? 'lg:w-[68px]' : 'lg:w-60'} ${mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-14 items-center gap-2.5 border-b border-line/70 px-4">
          <Logo className="h-8 w-8 flex-none" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-bold tracking-tight text-ink">ResQLink</div>
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink-dim">Command Center</div>
            </div>
          )}
          <button onClick={() => setCollapsed((c) => !c)} className="ml-auto hidden text-ink-faint hover:text-ink lg:block" aria-label="Collapse sidebar">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-dim">{group.label}</div>}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const badge = badgeVal(item.badge);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                      className={`nav-item ${active ? 'nav-item-on' : 'nav-item-off'} ${collapsed ? 'justify-center px-0' : ''}`}>
                      <Icon className="h-[18px] w-[18px] flex-none" strokeWidth={active ? 2.3 : 2} />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && badge ? (
                        <span className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${item.badge === 'gaps' || item.badge === 'acks' ? 'bg-sev-critical/90 text-white' : 'bg-brand-400/20 text-brand-300'}`}>{badge}</span>
                      ) : null}
                      {collapsed && badge ? <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-sev-critical" /> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {me && !collapsed && (
          <div className="border-t border-line/70 p-2.5">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold text-bg" style={{ background: me.avatarColor }}>
                {me.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-ink">{me.name}</div>
                <div className="truncate text-[10px] text-ink-faint">{ROLE_LABEL[me.role as keyof typeof ROLE_LABEL]}</div>
              </div>
              <button onClick={logout} className="text-ink-faint hover:text-sev-critical" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Command bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line/70 bg-surface/85 px-3 backdrop-blur lg:px-4">
          <button className="icon-btn lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu"><Menu className="h-4 w-4" /></button>

          <button onClick={() => setPaletteOpen(true)}
            className="group flex h-9 w-full max-w-sm items-center gap-2.5 rounded-lg border border-line bg-bg/60 px-3 text-ink-faint transition-colors hover:border-line hover:bg-bg">
            <Search className="h-4 w-4" />
            <span className="text-[13px]">Search or jump to…</span>
            <span className="ml-auto hidden items-center gap-1 sm:flex">
              <kbd className="kbd"><CmdIcon className="h-2.5 w-2.5" /></kbd><kbd className="kbd">K</kbd>
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium sm:flex ${connected ? 'border-sev-low/30 bg-sev-low/10 text-sev-low' : 'border-sev-critical/30 bg-sev-critical/10 text-sev-critical'}`}>
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3 animate-blink" />}
              {connected ? 'Live' : 'Reconnecting'}
            </span>
            {state?.ai && (
              <span className="hidden rounded-full border border-line px-2.5 py-1 text-2xs text-ink-faint md:inline">
                AI · {state.ai.mode === 'llm' ? 'LLM' : 'Rule engine'}
              </span>
            )}
            <NotificationCenter />
            {me && (
              <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-line bg-raised/60 py-1 pl-1 pr-2.5 transition-colors hover:bg-overlay lg:hidden" aria-label="Account">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-2xs font-bold text-bg" style={{ background: me.avatarColor }}>
                  {me.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </span>
              </button>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 pb-24 lg:p-5 lg:pb-5">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line/70 bg-surface/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${active ? 'text-brand-300' : 'text-ink-faint'}`}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile FAB */}
      <Link href="/reports" className="fixed bottom-16 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand-400 text-bg shadow-lg lg:hidden" aria-label="Quick report">
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </Link>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
