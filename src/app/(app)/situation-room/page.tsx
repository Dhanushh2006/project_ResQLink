'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import {
  MonitorPlay, Map as MapIcon, TriangleAlert, Send, Clock, Sparkles,
  Network, ShieldCheck, Activity, Copy, RefreshCw, Wifi,
} from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { Skeleton, EmptyState, Panel, PanelHeader } from '@/components/UI';
import { SeverityBadge, StatusBadge, AckBadge } from '@/components/Badges';
import { AlertRow, ActivityLine } from '@/components/OpsPrimitives';
import { ReadinessBar } from '@/components/Charts';
import { IncidentDrawer } from '@/components/IncidentDrawer';
import { useToast } from '@/components/Toast';
import { timeAgo, clockTime } from '@/lib/ui';
import { incidentTypeIcon } from '@/lib/status';

const OpsMap = dynamic(() => import('@/components/OpsMap').then((m) => m.OpsMap), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

export default function SituationRoom() {
  const { state, loading, connected } = useOps();
  const toast = useToast();
  const [brief, setBrief] = useState<{ brief: string; generatedAt: string } | null>(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const [drawer, setDrawer] = useState<string | null>(null);

  if (loading && !state) return <Skeleton className="h-[85vh]" />;
  if (!state) return null;

  const active = state.incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status));
  const s = state.stats;

  const genBrief = async () => { setBriefBusy(true); const res = await api('/api/brief', 'POST'); setBriefBusy(false); if (res.ok) setBrief(res.data as any); else toast.push(res.error || 'Failed', 'error'); };
  const copyBrief = () => { if (brief) { navigator.clipboard?.writeText(brief.brief); toast.push('Brief copied', 'success'); } };

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-400/30 bg-brand-400/10 text-brand-300"><MonitorPlay className="h-5 w-5" /></span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink">Situation Room</h1>
            <div className="flex items-center gap-1.5 text-2xs text-ink-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-sev-low animate-blink' : 'bg-sev-critical'}`} /> Emergency Operations Center · {connected ? 'Live' : 'Reconnecting'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <Metric label="Active" value={s.activeIncidents} tone="text-brand-300" />
          <Metric label="Critical" value={s.criticalIncidents} tone="text-sev-critical" />
          <Metric label="Gaps" value={s.openGaps} tone="text-sev-high" />
          <Metric label="Deployed" value={s.deployedResources} tone="text-sev-low" />
          <Metric label="Pending acks" value={s.pendingAcks} tone="text-sev-high" />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel className="overflow-hidden xl:col-span-8">
          <PanelHeader title="Operational Map" icon={MapIcon} action={<Link href="/map" className="text-xs text-brand-300 hover:underline">Full map</Link>} />
          <div style={{ height: '48vh' }}>
            <OpsMap state={state} filters={{ incidents: true, resources: true, facilities: true, zones: true, roads: true }} onSelectIncident={(id) => setDrawer(id)} />
          </div>
        </Panel>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="overflow-hidden">
            <PanelHeader title="Critical & Active" icon={TriangleAlert} />
            <div className="space-y-1.5 overflow-y-auto p-2.5" style={{ maxHeight: '23vh' }}>
              {active.length === 0 ? <EmptyState title="All clear" tone="positive" /> : active.map((i) => {
                const Icon = incidentTypeIcon(i.type);
                return (
                  <button key={i.id} onClick={() => setDrawer(i.id)} className="block w-full rounded-lg border border-line/70 bg-raised/40 px-2.5 py-2 text-left transition-colors hover:border-line">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-mono text-2xs text-ink-faint"><Icon className="h-3 w-3 text-ink-muted" />{i.id}</span>
                      <SeverityBadge severity={i.severity} size="xs" />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-ink">{i.title}</span>
                      <StatusBadge status={i.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
          <Panel className="overflow-hidden">
            <PanelHeader title="Agency States" icon={ShieldCheck} />
            <div className="space-y-2 overflow-y-auto p-3" style={{ maxHeight: '21vh' }}>
              {state.agencies.map((a) => (
                <div key={a.id}>
                  <div className="mb-0.5 flex items-center justify-between text-2xs">
                    <span className="flex items-center gap-1.5 text-ink-muted"><span className="h-2 w-2 rounded-full" style={{ background: a.color }} />{a.name}</span>
                    <span className="tabular-nums text-ink-faint">{a.readiness}%</span>
                  </div>
                  <ReadinessBar value={a.readiness} color={a.color} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Lower panels */}
      <div className="grid gap-3 xl:grid-cols-12">
        <Panel className="overflow-hidden xl:col-span-3">
          <PanelHeader title="Coordination Gaps" icon={Network} action={<span className="text-2xs text-ink-faint">{state.gaps.length}</span>} />
          <div className="space-y-1.5 overflow-y-auto p-2.5" style={{ height: '32vh' }}>
            {state.gaps.length === 0 ? <EmptyState title="Nominal" tone="positive" /> : state.gaps.map((g) => (
              <AlertRow key={g.id} severity={g.severity} title={g.title} detail={`→ ${g.suggestedAction}`} elapsedRef={g.elapsedRef} />
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-3">
          <PanelHeader title="Communication Flow" icon={Send} />
          <div className="space-y-1.5 overflow-y-auto p-2.5" style={{ height: '32vh' }}>
            {state.communications.length === 0 ? <EmptyState title="No messages" /> : state.communications.slice(0, 14).map((c) => (
              <div key={c.id} className="rounded-lg border border-line/70 bg-raised/40 p-2">
                <div className="flex items-center justify-between gap-1"><span className="truncate text-2xs font-medium text-ink">{c.subject}</span><AckBadge state={c.ackState} /></div>
                <div className="font-mono text-2xs text-ink-dim">{clockTime(c.createdAt)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-3">
          <PanelHeader title="Live Timeline" icon={Clock} />
          <div className="overflow-y-auto p-2.5" style={{ height: '32vh' }}>
            {state.auditEvents.slice(0, 24).map((e) => <ActivityLine key={e.id} time={e.createdAt} action={e.action} detail={e.detail || e.entityType} />)}
          </div>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-3">
          <PanelHeader title="AI Command Brief" icon={Sparkles} action={
            <div className="flex gap-1">
              <button className="icon-btn h-7 w-7" onClick={genBrief} disabled={briefBusy} aria-label="Generate"><RefreshCw className={`h-3.5 w-3.5 ${briefBusy ? 'animate-spin' : ''}`} /></button>
              {brief && <button className="icon-btn h-7 w-7" onClick={copyBrief} aria-label="Copy"><Copy className="h-3.5 w-3.5" /></button>}
            </div>
          } />
          <div className="overflow-y-auto p-3" style={{ height: '32vh' }}>
            {brief ? (
              <>
                <pre className="whitespace-pre-wrap font-sans text-2xs leading-relaxed text-ink-muted">{brief.brief}</pre>
                <div className="mt-2 text-2xs text-ink-dim">Generated {timeAgo(brief.generatedAt)} · {state.ai.mode === 'llm' ? 'LLM' : 'Rule engine'}</div>
              </>
            ) : <EmptyState title="No brief yet" hint="Generate a command briefing from the current situation." icon={Sparkles} />}
          </div>
        </Panel>
      </div>

      <IncidentDrawer incidentId={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="flex items-center gap-1.5"><span className={`text-lg font-bold tabular-nums ${tone}`}>{value}</span><span className="text-ink-faint">{label}</span></div>;
}
