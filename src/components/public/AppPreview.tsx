'use client';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, TriangleAlert, Map as MapIcon, Ambulance, Radio, Bell,
  Send, Search, Flame, Car, Waves, Shield, Building2, HeartPulse, Check, ArrowUpRight,
} from 'lucide-react';

const SEV = { CRITICAL: '#F0475A', HIGH: '#FB8A3C', MODERATE: '#F5C147' } as const;

const INCIDENTS = [
  { id: 'INC-2047', title: 'Industrial Fire', type: Flame, sev: 'CRITICAL' as const, loc: 'Central Industrial Zone', status: 'Escalated', x: 63, y: 40, units: 4 },
  { id: 'INC-2051', title: 'Multi-Vehicle Collision', type: Car, sev: 'HIGH' as const, loc: 'North Junction', status: 'Active', x: 33, y: 25, units: 3 },
  { id: 'INC-2053', title: 'Riverside Flooding', type: Waves, sev: 'MODERATE' as const, loc: 'Riverside District', status: 'Active', x: 23, y: 68, units: 2 },
];

/**
 * An authentic replica of the ResQLink Command Center surface — built from the
 * real design system (icon rail, command bar, KPI strip, incident list, live map,
 * coordination-gap panel). No browser chrome, no decorative effects.
 */
export function AppPreview() {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSel((s) => (s + 1) % INCIDENTS.length), 4200);
    return () => clearInterval(t);
  }, []);
  const active = INCIDENTS[sel];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-bg shadow-[0_24px_70px_-30px_rgba(0,0,0,0.85)]">
      <div className="flex h-[420px] text-ink">
        {/* Icon rail */}
        <div className="hidden w-12 flex-none flex-col items-center gap-1 border-r border-line/70 bg-surface py-3 sm:flex">
          <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-brand-400/10">
            <Radio className="h-4 w-4 text-brand-300" />
          </div>
          {[LayoutDashboard, TriangleAlert, MapIcon, Ambulance, Send, Bell].map((I, i) => (
            <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? 'bg-brand-400/10 text-brand-300' : 'text-ink-faint'}`}>
              <I className="h-[17px] w-[17px]" strokeWidth={2} />
            </div>
          ))}
        </div>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Command bar */}
          <div className="flex h-11 flex-none items-center gap-3 border-b border-line/70 bg-surface px-3">
            <div className="flex h-7 flex-1 items-center gap-2 rounded-md border border-line bg-bg/70 px-2.5 text-ink-faint">
              <Search className="h-3.5 w-3.5" />
              <span className="text-2xs">Search or jump to…</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-sev-low/30 bg-sev-low/10 px-2 py-0.5 text-2xs text-sev-low">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-sev-low" /> Live
            </span>
            <span className="h-6 w-6 flex-none rounded-full bg-brand-400 text-center text-2xs font-bold leading-6 text-bg">AR</span>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-hidden p-3">
            {/* KPI strip */}
            <div className="grid grid-cols-4 gap-2">
              {[['Active', '3', 'text-brand-300'], ['Critical', '1', 'text-sev-critical'], ['Deployed', '9', 'text-sev-low'], ['Gaps', '2', 'text-sev-high']].map(([l, v, c]) => (
                <div key={l} className="relative overflow-hidden rounded-lg border border-line/70 bg-surface px-2.5 py-1.5">
                  <span className="absolute inset-y-0 left-0 w-0.5 opacity-70" style={{ background: 'currentColor' }} />
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint">{l}</div>
                  <div className={`text-lg font-bold leading-none ${c}`}>{v}</div>
                </div>
              ))}
            </div>

            <div className="mt-2.5 grid grid-cols-5 gap-2.5" style={{ height: 'calc(100% - 52px)' }}>
              {/* Incident list */}
              <div className="col-span-2 flex flex-col overflow-hidden rounded-lg border border-line/70 bg-surface">
                <div className="flex items-center justify-between border-b border-line/70 px-2.5 py-1.5">
                  <span className="text-[10px] font-semibold text-ink">Incident Queue</span>
                  <ArrowUpRight className="h-3 w-3 text-ink-faint" />
                </div>
                <div className="min-h-0 flex-1 divide-y divide-line-soft overflow-hidden">
                  {INCIDENTS.map((i, idx) => {
                    const Icon = i.type;
                    return (
                      <button key={i.id} onClick={() => setSel(idx)} className={`flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors ${idx === sel ? 'bg-raised/70' : 'hover:bg-raised/40'}`}>
                        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md border border-line bg-raised" style={{ color: SEV[i.sev] }}>
                          <Icon className="h-3 w-3" strokeWidth={2.2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-ink">{i.title}</span>
                          <span className="block truncate text-[9px] text-ink-faint">{i.id} · {i.loc}</span>
                        </span>
                        <span className="rounded px-1 py-0.5 text-[8px] font-bold uppercase" style={{ background: `${SEV[i.sev]}1f`, color: SEV[i.sev] }}>{i.sev}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Map */}
              <div className="relative col-span-2 overflow-hidden rounded-lg border border-line/70 bg-[#0a0f16]">
                <div className="grid-backdrop absolute inset-0" />
                <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                  <line x1="33%" y1="25%" x2="63%" y2="40%" stroke="#232D3D" strokeWidth="1.25" strokeDasharray="3 4" />
                  <line x1="23%" y1="68%" x2="63%" y2="40%" stroke="#232D3D" strokeWidth="1.25" strokeDasharray="3 4" />
                </svg>
                {[[48, 56], [74, 64], [17, 36]].map(([x, y], i) => (
                  <span key={i} className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-brand-500/50" style={{ left: `${x}%`, top: `${y}%` }} />
                ))}
                {INCIDENTS.map((m, i) => {
                  const Icon = m.type; const on = i === sel;
                  return (
                    <span key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${m.x}%`, top: `${m.y}%`, zIndex: on ? 20 : 10 }}>
                      {on && <span className="absolute inset-0 -m-2.5 rounded-full" style={{ boxShadow: `0 0 0 2px ${SEV[m.sev]}55`, animation: 'pulseRing 2s infinite' }} />}
                      <span className={`flex items-center justify-center rounded-full border-2 border-white/80 text-bg transition-all ${on ? 'h-6 w-6' : 'h-4 w-4'}`} style={{ background: SEV[m.sev] }}>
                        <Icon className={on ? 'h-3 w-3' : 'h-2 w-2'} strokeWidth={2.6} />
                      </span>
                    </span>
                  );
                })}
                <div className="absolute bottom-1.5 left-1.5 rounded border border-line/70 bg-surface/85 px-1.5 py-0.5 text-[8px] text-ink-faint backdrop-blur">
                  Central Industrial Zone — Active Response
                </div>
              </div>

              {/* Gaps + agencies */}
              <div className="col-span-1 flex flex-col gap-2 overflow-hidden">
                <div className="flex-none rounded-lg border border-sev-high/40 bg-sev-high/5 p-2">
                  <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-sev-high">
                    <TriangleAlert className="h-2.5 w-2.5" /> Gap
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold text-ink">EMS ack overdue</div>
                  <div className="font-mono text-[9px] text-sev-high">03:18</div>
                </div>
                <div className="min-h-0 flex-1 rounded-lg border border-line/70 bg-surface p-2">
                  <div className="text-[8px] font-semibold uppercase tracking-wider text-ink-faint">Agencies</div>
                  <div className="mt-1 space-y-1">
                    {[[Shield, '#3DD68C'], [Flame, '#a3e635'], [Ambulance, '#F5C147'], [Building2, '#3DD68C']].map(([I, c], i) => {
                      const Icon = I as any;
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          <Icon className="h-2.5 w-2.5 text-ink-muted" />
                          <span className="h-1 flex-1 rounded-full bg-line">
                            <span className="block h-full rounded-full" style={{ width: `${70 + i * 8}%`, background: c as string }} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
