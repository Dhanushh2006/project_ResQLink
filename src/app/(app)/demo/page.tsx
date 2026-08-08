'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Play, Pause, StepForward, RotateCcw, ChevronRight, Check, Flame, Waves, Car, Users, Activity } from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { PageHeader, Panel, PanelHeader, Skeleton } from '@/components/UI';
import { useToast } from '@/components/Toast';

const SCENARIO_ICON: Record<string, any> = { 'SC-FIRE': Flame, 'SC-FLOOD': Waves, 'SC-COLLISION': Car, 'SC-CROWD': Users, 'SC-QUAKE': Activity };

export default function DemoPage() {
  const { state, loading, refresh } = useOps();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);

  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;
  const sim = state.sim;

  const control = async (action: string, scenarioId?: string) => {
    setBusy(action);
    const res = await api('/api/sim', 'POST', { action, scenarioId });
    setBusy(null);
    if (!res.ok) toast.push(res.error || 'Failed', 'error'); else refresh();
    return res;
  };
  const runAll = async () => {
    setAuto(true);
    await control('start', 'SC-FIRE');
    for (let i = 0; i < 22; i++) { await control('step'); await new Promise((r) => setTimeout(r, 650)); }
    setAuto(false);
    toast.push('Demo scenario complete — check Situation Room & Audit', 'success');
  };
  const reset = async () => { setBusy('reset'); await api('/api/admin/reset', 'POST'); setBusy(null); refresh(); toast.push('System reset to seed state', 'info'); };

  return (
    <div>
      <PageHeader title="Demo Control" subtitle="Deterministic scenario orchestration — every step performs real operations" icon={Play}>
        <span className="chip bg-sev-moderate/10 text-sev-moderate ring-1 ring-inset ring-sev-moderate/25">DEMO SIMULATION</span>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-sev-critical" />
              <h2 className="text-sm font-semibold text-ink">Primary Showcase — Industrial Fire + Traffic Disruption</h2>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
              A 22-step scenario. Each step triggers real service-layer operations (reports, AI triage, agency coordination,
              resource deployment, communications, escalation, resolution) and propagate live over the real-time stream.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={runAll} disabled={auto || !!busy}>{auto ? <><Pause className="h-4 w-4" /> Running…</> : <><Play className="h-4 w-4" /> Run Full Scenario</>}</button>
              <button className="btn-ghost" onClick={() => control('start', 'SC-FIRE')} disabled={auto || !!busy}>Start (manual)</button>
              <button className="btn-ghost" onClick={() => control('step')} disabled={auto || !!busy || !sim.running}><StepForward className="h-4 w-4" /> Step</button>
              <button className="btn-ghost" onClick={reset} disabled={!!busy}><RotateCcw className="h-4 w-4" /> {busy === 'reset' ? '…' : 'Reset'}</button>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Progress</span><span className="tabular-nums">{sim.step} / {sim.totalSteps}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-500" style={{ width: `${(sim.step / sim.totalSteps) * 100}%` }} />
              </div>
              {sim.currentStep && (
                <div className="mt-3 rounded-xl border border-brand-400/30 bg-brand-400/5 p-3">
                  <div className="text-xs font-semibold text-brand-300">Step {sim.currentStep.index}: {sim.currentStep.title}</div>
                  <div className="mt-0.5 text-xs text-ink-muted">{sim.currentStep.detail}</div>
                </div>
              )}
              {sim.incidentId && <Link href={`/incidents/${sim.incidentId}`} className="btn-ghost btn-sm mt-3">Open demo incident {sim.incidentId} <ChevronRight className="h-3.5 w-3.5" /></Link>}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Scenario Steps" />
            <ol className="grid gap-1 p-3 sm:grid-cols-2">
              {sim.steps.map((st: any) => (
                <li key={st.index} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${st.index <= sim.step ? 'text-ink' : 'text-ink-faint'}`}>
                  <span className={`mt-px flex h-4 w-4 flex-none items-center justify-center rounded-full text-[9px] font-bold ${st.index < sim.step ? 'bg-sev-low/80 text-bg' : st.index === sim.step ? 'bg-brand-400 text-bg' : 'bg-line text-ink-faint'}`}>
                    {st.index < sim.step ? <Check className="h-2.5 w-2.5" /> : st.index}
                  </span>
                  <span><span className="font-medium">{st.title}</span> — {st.detail}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Scenario Library" />
            <div className="space-y-2 p-3">
              {state.scenarios.map((sc) => {
                const Icon = SCENARIO_ICON[sc.id] || Activity;
                return (
                  <button key={sc.id} onClick={() => control('start', sc.id)} disabled={sc.id !== 'SC-FIRE'}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs transition-colors ${sc.primary ? 'border-brand-400/30 bg-brand-400/5' : 'border-line/70 bg-raised/30 opacity-70'}`}>
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-raised text-ink-muted"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><span className="font-medium text-ink">{sc.name}</span>{sc.primary && <span className="chip bg-brand-400/15 text-brand-300">Primary</span>}</div>
                      <div className="mt-0.5 text-ink-faint">{sc.summary}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Judge Tip</div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Run the full scenario, then walk judges through the <Link href="/situation-room" className="text-brand-300 hover:underline">Situation Room</Link>,
              the <Link href="/alerts" className="text-brand-300 hover:underline">Coordination Gaps</Link>, and the
              <Link href="/audit" className="text-brand-300 hover:underline"> Audit Trail</Link> to show the complete, accountable loop.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
