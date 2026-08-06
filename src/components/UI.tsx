'use client';
import { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  title, subtitle, children, icon: Icon,
}: { title: string; subtitle?: string; children?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line/70 bg-raised text-brand-300">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink lg:text-[22px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function PanelHeader({
  title, subtitle, action, icon: Icon,
}: { title: string; subtitle?: string; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="panel-header">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-4 w-4 flex-none text-ink-faint" strokeWidth={2} />}
        <div className="min-w-0">
          <h2 className="panel-title truncate">{title}</h2>
          {subtitle && <p className="text-2xs text-ink-faint">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Section({ title, children, action, icon }: { title: string; children: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <section className="panel">
      <PanelHeader title={title} action={action} icon={icon} />
      <div className="p-4">{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  ink: 'text-ink', red: 'text-sev-critical', orange: 'text-sev-high', amber: 'text-sev-moderate',
  green: 'text-sev-low', sky: 'text-brand-300', indigo: 'text-emerald-300', emerald: 'text-emerald-300',
  slate: 'text-ink-muted',
};

const TONE_BAR: Record<string, string> = {
  ink: 'bg-ink-dim', red: 'bg-sev-critical', orange: 'bg-sev-high', amber: 'bg-sev-moderate',
  green: 'bg-sev-low', sky: 'bg-brand-400', indigo: 'bg-emerald-400', emerald: 'bg-emerald-400', slate: 'bg-ink-dim',
};

export function Metric({
  label, value, hint, tone = 'ink', icon: Icon, trend, pulse,
}: {
  label: string; value: React.ReactNode; hint?: string;
  tone?: keyof typeof TONES; icon?: LucideIcon; trend?: string; pulse?: boolean;
}) {
  return (
    <div className="stat-tile group transition-colors hover:border-line">
      <span className={`absolute inset-y-0 left-0 w-0.5 rounded-l-xl ${TONE_BAR[tone] || TONE_BAR.ink} opacity-70`} aria-hidden />
      <div className="flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">{label}</span>
        {Icon && <Icon className={`h-4 w-4 opacity-50 ${TONES[tone]}`} strokeWidth={2} />}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <AnimatedNumber value={typeof value === 'number' ? value : NaN} fallback={value} className={`text-[26px] font-bold leading-none tracking-tight tabular-nums ${TONES[tone]}`} />
        {pulse && <span className={`h-1.5 w-1.5 rounded-full ${TONES[tone].replace('text-', 'bg-')} animate-blink`} />}
      </div>
      {hint && <div className="mt-1 text-2xs text-ink-faint">{hint}</div>}
      {trend && <div className="mt-1 text-2xs text-ink-muted">{trend}</div>}
    </div>
  );
}

export function AnimatedNumber({ value, fallback, className }: { value: number; fallback?: React.ReactNode; className?: string }) {
  const [popKey, setPopKey] = useState(0);
  const prev = useRef(value);
  useEffect(() => {
    if (!Number.isNaN(value) && prev.current !== value) {
      setPopKey((k) => k + 1);
      prev.current = value;
    }
  }, [value]);
  if (Number.isNaN(value)) return <span className={className}>{fallback}</span>;
  return <span key={popKey} className={`${className} inline-block animate-countPop`}>{value}</span>;
}

export function EmptyState({ title, hint, icon: Icon = ShieldCheck, tone = 'muted' }: { title: string; hint?: string; icon?: LucideIcon; tone?: 'muted' | 'positive' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line/70 bg-bg/30 px-6 py-10 text-center">
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${tone === 'positive' ? 'bg-sev-low/10 text-sev-low' : 'bg-raised text-ink-faint'}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="text-[13px] font-semibold text-ink">{title}</div>
      {hint && <div className="max-w-xs text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function Modal({
  open, onClose, title, children, wide, icon: Icon,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean; icon?: LucideIcon }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`animate-scaleIn mt-[6vh] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} panel`} onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-brand-300" strokeWidth={2} />}
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/** Right-side contextual drawer. */
export function Drawer({
  open, onClose, children, width = 'max-w-md', label,
}: { open: boolean; onClose: () => void; children: React.ReactNode; width?: string; label?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-fadeIn" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full ${width} animate-slideInRight overflow-y-auto border-l border-line bg-surface shadow-drawer`}>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel,
}: { open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-[13px] text-ink-muted">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button className={`${danger ? 'btn-danger' : 'btn-primary'} btn-sm`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button onClick={onClick} className={`filter-chip ${active ? 'filter-chip-on' : 'filter-chip-off'}`}>
      {children}
      {count !== undefined && <span className={`rounded px-1 text-2xs tabular-nums ${active ? 'bg-brand-400/20' : 'bg-raised'}`}>{count}</span>}
    </button>
  );
}

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-overlay px-2 py-1 text-2xs text-ink opacity-0 shadow-raised transition-opacity group-hover/tt:opacity-100">
        {label}
      </span>
    </span>
  );
}
