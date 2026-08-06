'use client';
import { sevMeta, statusMeta, priorityMeta } from '@/lib/status';

export function SeverityBadge({ severity, size = 'sm' }: { severity: string; size?: 'sm' | 'xs' }) {
  const m = sevMeta(severity);
  const Icon = m.icon;
  return (
    <span className={`chip ${m.chip} ${size === 'xs' ? 'text-[10px]' : ''}`}>
      <Icon className="h-3 w-3" strokeWidth={2.4} aria-hidden />
      {m.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const m = statusMeta(status);
  const Icon = m.icon;
  return (
    <span className={`chip ${m.chip}`}>
      <Icon className={`h-3 w-3 ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} strokeWidth={2.2} aria-hidden />
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const m = priorityMeta(priority);
  const Icon = m.icon;
  return (
    <span className={`chip ${m.chip}`}>
      <Icon className="h-3 w-3" strokeWidth={2.2} aria-hidden />
      {m.label}
    </span>
  );
}

export function AckBadge({ state }: { state: string }) {
  const m = statusMeta(state);
  const Icon = m.icon;
  return (
    <span className={`chip ${m.chip}`}>
      <Icon className="h-3 w-3" strokeWidth={2.2} aria-hidden />
      {m.label}
    </span>
  );
}

/** Small dot + text status for dense contexts */
export function StatusDot({ status, label }: { status: string; label?: string }) {
  const m = statusMeta(status);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden />
      {label ?? m.label}
    </span>
  );
}
