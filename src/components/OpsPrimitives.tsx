'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { sevMeta } from '@/lib/status';
import { clockTime } from '@/lib/ui';

/** Live elapsed timer that ticks every second. */
export function ElapsedTimer({ since, className = '' }: { since: string; className?: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((Date.now() - +new Date(since)) / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <span className={`font-mono tabular-nums ${className}`}>{mm}:{ss}</span>;
}

/** Sophisticated alert row — attention without visual chaos. */
export function AlertRow({
  severity, title, detail, elapsedRef, meta, actions,
}: {
  severity: string; title: string; detail?: string; elapsedRef?: string | null;
  meta?: string; actions?: React.ReactNode;
}) {
  const m = sevMeta(severity);
  const isCritical = severity === 'CRITICAL';
  return (
    <div className={`group relative flex items-start gap-3 rounded-lg border bg-surface/60 p-3 transition-colors ${isCritical ? 'border-sev-critical/40' : 'border-line/70 hover:border-line'}`}>
      <span className={`absolute inset-y-0 left-0 w-0.5 rounded-l-lg ${m.dot}`} aria-hidden />
      <span className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md ${m.chip}`}>
        <m.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={`text-2xs font-bold uppercase tracking-wider ${m.fg}`}>{m.label}</span>
          {meta && <span className="text-2xs text-ink-faint">· {meta}</span>}
          {elapsedRef && <ElapsedTimer since={elapsedRef} className={`ml-auto text-2xs ${m.fg}`} />}
        </div>
        <div className="mt-0.5 text-[13px] font-semibold text-ink">{title}</div>
        {detail && <div className="mt-0.5 text-xs text-ink-muted">{detail}</div>}
        {actions && <div className="mt-2 flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
    </div>
  );
}

const KIND_STYLE: Record<string, { dot: string; ring: string }> = {
  AI: { dot: 'bg-emerald-400', ring: 'ring-emerald-400/30' },
  STATUS: { dot: 'bg-brand-400', ring: 'ring-brand-400/30' },
  ESCALATION: { dot: 'bg-sev-critical', ring: 'ring-sev-critical/30' },
  RESOURCE: { dot: 'bg-sev-low', ring: 'ring-sev-low/30' },
  SYSTEM: { dot: 'bg-ink-faint', ring: 'ring-line' },
  NOTE: { dot: 'bg-ink-muted', ring: 'ring-line' },
};

export interface TimelineItem {
  id: string; kind: string; title: string; message: string; at: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-3 pl-5">
      <span className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-line" aria-hidden />
      {items.map((u) => {
        const st = KIND_STYLE[u.kind] || KIND_STYLE.NOTE;
        return (
          <li key={u.id} className="relative animate-fadeIn">
            <span className={`absolute -left-[13px] top-1 h-2.5 w-2.5 rounded-full ${st.dot} ring-4 ${st.ring} ring-offset-0`} aria-hidden />
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xs font-semibold uppercase tracking-wide text-ink-faint">{u.title}</span>
              <span className="font-mono text-2xs text-ink-dim">{clockTime(u.at)}</span>
            </div>
            <div className="text-[13px] text-ink-muted">{u.message}</div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact activity feed line (for situation room). */
export function ActivityLine({ time, action, detail }: { time: string; action: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 py-1 text-xs animate-fadeIn">
      <span className="mt-px font-mono text-2xs text-ink-dim">{clockTime(time)}</span>
      <span className="text-ink-muted"><span className="font-medium text-ink">{action}</span> · {detail}</span>
    </div>
  );
}
