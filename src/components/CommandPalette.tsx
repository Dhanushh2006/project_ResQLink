'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, MonitorPlay, TriangleAlert, Map, Ambulance,
  ListChecks, Send, Bell, Radio, Network, ScrollText, Play, Settings,
  CornerDownLeft, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { incidentTypeIcon, resourceTypeIcon } from '@/lib/status';

interface Item {
  id: string; label: string; sub?: string; icon: any; run: () => void; group: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { state } = useOps();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const go = (href: string) => { router.push(href); onClose(); };

  const items: Item[] = useMemo(() => {
    const nav: Item[] = [
      { id: 'n-dash', label: 'Command Center', icon: LayoutDashboard, run: () => go('/dashboard'), group: 'Navigate' },
      { id: 'n-sit', label: 'Situation Room', icon: MonitorPlay, run: () => go('/situation-room'), group: 'Navigate' },
      { id: 'n-inc', label: 'Incidents', icon: TriangleAlert, run: () => go('/incidents'), group: 'Navigate' },
      { id: 'n-map', label: 'Operational Map', icon: Map, run: () => go('/map'), group: 'Navigate' },
      { id: 'n-res', label: 'Resources', icon: Ambulance, run: () => go('/resources'), group: 'Navigate' },
      { id: 'n-task', label: 'Tasks', icon: ListChecks, run: () => go('/tasks'), group: 'Navigate' },
      { id: 'n-comm', label: 'Communications', icon: Send, run: () => go('/communications'), group: 'Navigate' },
      { id: 'n-alert', label: 'Alerts & Gaps', icon: Bell, run: () => go('/alerts'), group: 'Navigate' },
      { id: 'n-rep', label: 'Field Reports', icon: Radio, run: () => go('/reports'), group: 'Navigate' },
      { id: 'n-ag', label: 'Agencies', icon: Network, run: () => go('/agencies'), group: 'Navigate' },
      { id: 'n-aud', label: 'Audit Trail', icon: ScrollText, run: () => go('/audit'), group: 'Navigate' },
      { id: 'n-demo', label: 'Demo Control', icon: Play, run: () => go('/demo'), group: 'Navigate' },
      { id: 'n-set', label: 'Settings', icon: Settings, run: () => go('/settings'), group: 'Navigate' },
    ];
    const incidents: Item[] = (state?.incidents || []).slice(0, 40).map((i) => ({
      id: i.id, label: i.title, sub: `${i.id} · ${i.locationName}`, icon: incidentTypeIcon(i.type),
      run: () => go(`/incidents/${i.id}`), group: 'Incidents',
    }));
    const resources: Item[] = (state?.resources || []).map((r) => ({
      id: r.id, label: r.label, sub: `${r.type.replace(/_/g, ' ')} · ${r.status}`, icon: resourceTypeIcon(r.type),
      run: () => go('/resources'), group: 'Resources',
    }));
    return [...nav, ...incidents, ...resources];
  }, [state]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items.filter((i) => i.group === 'Navigate');
    const t = q.toLowerCase();
    return items.filter((i) => (i.label + (i.sub || '') + i.id).toLowerCase().includes(t)).slice(0, 24);
  }, [q, items]);

  useEffect(() => { setActive(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); filtered[active]?.run(); }
      else if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, active, onClose]);

  if (!open) return null;

  const groups = filtered.reduce<Record<string, Item[]>>((acc, i) => { (acc[i.group] ||= []).push(i); return acc; }, {});
  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-scaleIn mt-[10vh] w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-ink-faint" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search incidents, resources, or jump to…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint" />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-ink-faint">No results for “{q}”</div>
          ) : (
            Object.entries(groups).map(([group, list]) => (
              <div key={group} className="mb-1">
                <div className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-ink-dim">{group}</div>
                {list.map((i) => {
                  flatIndex += 1;
                  const idx = flatIndex;
                  const Icon = i.icon;
                  return (
                    <button key={i.id} onMouseEnter={() => setActive(idx)} onClick={i.run}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${active === idx ? 'bg-brand-400/10 text-ink' : 'text-ink-muted hover:bg-raised/60'}`}>
                      <Icon className={`h-4 w-4 flex-none ${active === idx ? 'text-brand-300' : 'text-ink-faint'}`} strokeWidth={2} />
                      <span className="flex-1 truncate">{i.label}</span>
                      {i.sub && <span className="truncate text-2xs text-ink-faint">{i.sub}</span>}
                      {active === idx && <CornerDownLeft className="h-3.5 w-3.5 text-ink-faint" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-2xs text-ink-faint">
          <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
          <span className="inline-flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
          <span className="ml-auto">ResQLink Command</span>
        </div>
      </div>
    </div>
  );
}
