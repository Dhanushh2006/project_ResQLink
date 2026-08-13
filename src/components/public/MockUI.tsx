'use client';
import { Flame, Ambulance, Shield, Building2, HeartPulse, Check, Sparkles, TriangleAlert, MapPin, Clock, Bell, Send, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const SEV = { CRITICAL: '#F0475A', HIGH: '#FB8A3C', MODERATE: '#F5C147', LOW: '#3DD68C' };

/** A real product panel — header with title + icon, matching the in-app design. */
function Panel({ title, icon: Icon, children, className = '' }: { title: string; icon: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line/80 bg-surface ${className}`}>
      <div className="flex items-center gap-2 border-b border-line/70 px-3.5 py-2.5">
        <Icon className="h-4 w-4 text-ink-faint" strokeWidth={2} />
        <span className="text-[13px] font-semibold tracking-tight text-ink">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** Mini live operational map. */
export function MockMap({ className = '' }: { className?: string }) {
  return (
    <div className={`relative grid-backdrop overflow-hidden rounded-lg border border-line/70 bg-[#0a0f16] ${className}`}>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <line x1="30%" y1="28%" x2="64%" y2="44%" stroke="#232D3D" strokeWidth="1.5" strokeDasharray="3 4" />
        <line x1="20%" y1="70%" x2="64%" y2="44%" stroke="#232D3D" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
      {[['64%', '44%', SEV.CRITICAL, Flame], ['30%', '28%', SEV.HIGH, Building2], ['20%', '70%', SEV.MODERATE, HeartPulse]].map(([x, y, c, I], idx) => {
        const Icon = I as any;
        return (
          <span key={idx} className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80" style={{ left: x as string, top: y as string, background: c as string }}>
            <Icon className="h-3 w-3 text-bg" strokeWidth={2.5} />
          </span>
        );
      })}
      {[['48%', '58%'], ['74%', '64%'], ['16%', '36%']].map(([x, y], i) => (
        <span key={i} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-brand-500/50" style={{ left: x, top: y }} />
      ))}
      <div className="absolute bottom-2 left-2 flex gap-2 rounded-md border border-line/70 bg-surface/85 px-2 py-1 text-[9px] text-ink-faint backdrop-blur">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sev-critical" />Critical</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sev-high" />High</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-sm bg-brand-500/60" />Facility</span>
      </div>
    </div>
  );
}

export function MockIncident({ className = '' }: { className?: string }) {
  return (
    <Panel title="Incident" icon={TriangleAlert} className={className}>
      <div className="p-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised" style={{ color: SEV.CRITICAL }}><Flame className="h-4 w-4" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-2xs text-ink-faint">INC-2047</span>
              <span className="rounded px-1 text-[9px] font-bold uppercase" style={{ background: `${SEV.CRITICAL}1f`, color: SEV.CRITICAL }}>Critical</span>
            </div>
            <div className="truncate text-[13px] font-semibold text-ink">Industrial Fire</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-2xs text-ink-faint"><MapPin className="h-3 w-3" />Central Industrial Zone</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['4', 'Agencies'], ['9', 'Units'], ['Escalated', 'Status']].map(([v, l]) => (
            <div key={l} className="rounded-lg border border-line/70 bg-raised/40 py-1.5"><div className="text-[13px] font-bold text-ink">{v}</div><div className="text-[9px] uppercase text-ink-faint">{l}</div></div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-500/[0.06] p-2.5">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300"><Sparkles className="h-2.5 w-2.5" /> Recommended</div>
          <div className="mt-1 text-2xs leading-snug text-ink-muted">Escalate to Critical — fire spreading toward adjacent warehouse. Deploy 2 additional units.</div>
          <div className="mt-2 flex gap-1.5">
            <span className="flex items-center gap-1 rounded-md bg-brand-400 px-2 py-0.5 text-[9px] font-semibold text-bg"><Check className="h-2.5 w-2.5" />Approve</span>
            <span className="rounded-md border border-line px-2 py-0.5 text-[9px] text-ink-faint">Modify</span>
            <span className="rounded-md border border-line px-2 py-0.5 text-[9px] text-ink-faint">Reject</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function MockReadiness({ className = '' }: { className?: string }) {
  const rows = [
    { icon: Shield, name: 'Metro Police', status: 'Ready', color: '#3DD68C', v: 84 },
    { icon: Flame, name: 'Fire & Rescue', status: 'Active', color: '#a3e635', v: 88 },
    { icon: Ambulance, name: 'City EMS', status: 'Partial', color: '#F5C147', v: 62 },
    { icon: Building2, name: 'Municipal', status: 'Ready', color: '#3DD68C', v: 79 },
  ];
  return (
    <Panel title="Agency readiness" icon={Network} className={className}>
      <div className="divide-y divide-line-soft">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.name} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <Icon className="h-3.5 w-3.5 text-ink-muted" />
              <span className="w-24 flex-none truncate text-2xs text-ink">{r.name}</span>
              <span className="h-1.5 flex-1 rounded-full bg-line"><span className="block h-full rounded-full" style={{ width: `${r.v}%`, background: r.color }} /></span>
              <span className="w-14 flex-none text-right text-[9px] font-semibold uppercase" style={{ color: r.color }}>{r.status}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function MockComms({ className = '' }: { className?: string }) {
  const msgs = [
    { agency: 'Fire & Rescue', ack: 'Acknowledged', color: '#3DD68C', text: 'Deploy to Central Industrial Zone. Confirm units.' },
    { agency: 'City EMS', ack: 'Acknowledged', color: '#3DD68C', text: 'Stage ambulances at Central Staging Ground.' },
    { agency: 'Metro Police', ack: 'Pending', color: '#FB8A3C', text: 'Establish perimeter and manage traffic.' },
  ];
  return (
    <Panel title="Communications" icon={Send} className={className}>
      <div className="space-y-2 p-3.5">
        {msgs.map((m) => (
          <div key={m.agency} className="rounded-lg border border-line/70 bg-raised/40 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold text-ink">{m.agency}</span>
              <span className="flex items-center gap-1 text-[9px] font-semibold uppercase" style={{ color: m.color }}>
                {m.ack === 'Acknowledged' ? <Check className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}{m.ack}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] leading-snug text-ink-muted">{m.text}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function MockGap({ className = '' }: { className?: string }) {
  return (
    <Panel title="Coordination gaps" icon={Bell} className={className}>
      <div className="p-3.5">
        <div className="relative rounded-lg border border-sev-high/40 bg-sev-high/[0.06] p-2.5">
          <span className="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-sev-high" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-sev-high"><TriangleAlert className="h-2.5 w-2.5" /> Coordination gap</span>
            <span className="font-mono text-[10px] text-sev-high">03:18</span>
          </div>
          <div className="mt-1 text-2xs font-semibold text-ink">EMS acknowledgement overdue</div>
          <div className="text-[10px] text-ink-muted">Incident #2047 · escalate to EMS coordinator</div>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-md bg-brand-400 px-2 py-0.5 text-[9px] font-semibold text-bg">Escalate</span>
            <span className="rounded-md border border-line px-2 py-0.5 text-[9px] text-ink-faint">Contact</span>
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-line/70 bg-raised/40 p-2.5 opacity-70">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-ink-faint">Task overdue</span>
            <span className="font-mono text-[10px] text-ink-faint">01:42</span>
          </div>
          <div className="mt-1 text-2xs font-semibold text-ink">Clear North Access Road</div>
        </div>
      </div>
    </Panel>
  );
}
