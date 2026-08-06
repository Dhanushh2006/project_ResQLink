'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, TriangleAlert, Activity, Cpu, Check, X } from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { timeAgo } from '@/lib/ui';

interface Note { id: string; category: 'Critical' | 'Operational' | 'System'; title: string; detail: string; at: string; href?: string; }

export function NotificationCenter() {
  const { state } = useOps();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  const notes: Note[] = useMemo(() => {
    if (!state) return [];
    const out: Note[] = [];
    for (const g of state.gaps.slice(0, 6)) {
      out.push({ id: `gap-${g.id}`, category: g.severity === 'CRITICAL' ? 'Critical' : 'Operational', title: g.title, detail: g.suggestedAction, at: g.createdAt, href: g.incidentId ? `/incidents/${g.incidentId}` : '/alerts' });
    }
    for (const a of state.alerts.filter((x) => x.status === 'OPEN').slice(0, 6)) {
      out.push({ id: `alert-${a.id}`, category: a.severity === 'CRITICAL' ? 'Critical' : 'Operational', title: a.title, detail: a.detail, at: a.createdAt, href: a.incidentId ? `/incidents/${a.incidentId}` : '/alerts' });
    }
    for (const r of state.recommendations.filter((x) => x.status === 'PENDING').slice(0, 4)) {
      out.push({ id: `rec-${r.id}`, category: 'System', title: r.title, detail: `${r.agent} · awaiting approval`, at: r.createdAt, href: r.incidentId ? `/incidents/${r.incidentId}` : '/dashboard' });
    }
    return out.filter((n) => !dismissed.has(n.id)).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [state, dismissed]);

  const critical = notes.filter((n) => n.category === 'Critical').length;
  const CAT_ICON = { Critical: TriangleAlert, Operational: Activity, System: Cpu };
  const CAT_COLOR = { Critical: 'text-sev-critical', Operational: 'text-sev-high', System: 'text-emerald-300' };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="icon-btn relative" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {notes.length > 0 && (
          <span className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${critical ? 'bg-sev-critical' : 'bg-brand-500'}`}>
            {notes.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[22rem] animate-scaleIn overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-[13px] font-semibold text-ink">Notifications</span>
            <span className="text-2xs text-ink-faint">{critical} critical · {notes.length} total</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Check className="h-6 w-6 text-sev-low" />
                <div className="text-[13px] font-medium text-ink">All clear</div>
                <div className="text-xs text-ink-faint">No notifications require attention.</div>
              </div>
            ) : notes.map((n) => {
              const Icon = CAT_ICON[n.category];
              return (
                <div key={n.id} className="group flex items-start gap-2.5 border-b border-line-soft px-4 py-3 last:border-0 hover:bg-raised/50">
                  <Icon className={`mt-0.5 h-4 w-4 flex-none ${CAT_COLOR[n.category]}`} strokeWidth={2.2} />
                  <button onClick={() => { if (n.href) router.push(n.href); setOpen(false); }} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xs font-bold uppercase tracking-wide ${CAT_COLOR[n.category]}`}>{n.category}</span>
                      <span className="text-2xs text-ink-dim">{timeAgo(n.at)}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[13px] font-medium text-ink">{n.title}</div>
                    <div className="truncate text-xs text-ink-faint">{n.detail}</div>
                  </button>
                  <button onClick={() => setDismissed((s) => new Set([...s, n.id]))} className="text-ink-dim opacity-0 transition-opacity hover:text-ink group-hover:opacity-100" aria-label="Dismiss">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
