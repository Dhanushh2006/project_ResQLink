'use client';

// Lightweight, dependency-free SVG/flex data visualizations.
// Each communicates real operational information (no decoration).

export function ReadinessBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(3, value)}%`, background: color }} />
    </div>
  );
}

/** Horizontal stacked distribution bar (e.g. incident severity split). */
export function DistributionBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-line">
        {segments.map((s) => (
          <div key={s.label} className="h-full transition-all duration-500" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-2xs text-ink-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label} <span className="font-semibold tabular-nums text-ink">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Vertical mini bars for a small time-series / category set. */
export function MiniBars({ data, color = '#a3e635', height = 44 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${(v / max) * 100}%`, minHeight: 2, background: color, opacity: 0.55 + (i / data.length) * 0.45 }} />
      ))}
    </div>
  );
}

/** Acknowledgement funnel: Sent → Delivered → Acknowledged. */
export function AckFunnel({ sent, delivered, acknowledged }: { sent: number; delivered: number; acknowledged: number }) {
  const stages = [
    { label: 'Sent', value: sent, color: '#5E6B7E' },
    { label: 'Delivered', value: delivered, color: '#a3e635' },
    { label: 'Acknowledged', value: acknowledged, color: '#3DD68C' },
  ];
  const max = Math.max(1, sent);
  return (
    <div className="space-y-2">
      {stages.map((s) => (
        <div key={s.label}>
          <div className="mb-1 flex items-center justify-between text-2xs">
            <span className="text-ink-muted">{s.label}</span>
            <span className="font-semibold tabular-nums text-ink">{s.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.value / max) * 100}%`, background: s.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Radial gauge for a single percentage. */
export function Gauge({ value, size = 60, color = '#a3e635', label }: { value: number; size?: number; color?: string; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#232D3D" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} className="transition-all duration-700" />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums text-ink">{value}<span className="text-2xs text-ink-faint">%</span></span>
      {label && <span className="absolute -bottom-4 text-2xs text-ink-faint">{label}</span>}
    </div>
  );
}
