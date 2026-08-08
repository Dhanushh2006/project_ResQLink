'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import {
  Plus, Radio, Map as MapIcon, ArrowUpRight, TriangleAlert, Ambulance,
  Bell, Send, Activity, ShieldCheck, Sparkles, ListChecks, MonitorPlay,
} from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { PageHeader, Metric, EmptyState, Skeleton, Modal, Panel, PanelHeader } from '@/components/UI';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { RecommendationCard } from '@/components/RecommendationCard';
import { AlertRow } from '@/components/OpsPrimitives';
import { ReadinessBar, DistributionBar } from '@/components/Charts';
import { IncidentDrawer } from '@/components/IncidentDrawer';
import { useToast } from '@/components/Toast';
import { timeAgo } from '@/lib/ui';
import { incidentTypeIcon } from '@/lib/status';
import { CreateIncidentForm } from '@/components/forms/CreateIncidentForm';
import { BroadcastForm } from '@/components/forms/BroadcastForm';

const OpsMap = dynamic(() => import('@/components/OpsMap').then((m) => m.OpsMap), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

export default function Dashboard() {
  const { state, loading } = useOps();
  const toast = useToast();
  const [modal, setModal] = useState<null | 'incident' | 'broadcast'>(null);
  const [drawer, setDrawer] = useState<string | null>(null);

  if (loading && !state) return <DashboardSkeleton />;
  if (!state) return null;

  const active = state.incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status));
  const pendingRecs = state.recommendations.filter((r) => r.status === 'PENDING');
  const s = state.stats;

  const sevSegments = [
    { label: 'Critical', value: active.filter((i) => i.severity === 'CRITICAL').length, color: '#F0475A' },
    { label: 'High', value: active.filter((i) => i.severity === 'HIGH').length, color: '#FB8A3C' },
    { label: 'Moderate', value: active.filter((i) => i.severity === 'MODERATE').length, color: '#F5C147' },
    { label: 'Low', value: active.filter((i) => i.severity === 'LOW').length, color: '#3DD68C' },
  ];

  return (
    <div>
      <PageHeader title="Command Center" subtitle="Unified operational picture across all agencies" icon={Radio}>
        <Link href="/situation-room" className="btn-ghost btn-sm"><MonitorPlay className="h-4 w-4" /> Situation Room</Link>
        <button className="btn-ghost btn-sm" onClick={() => setModal('broadcast')}><Send className="h-4 w-4" /> Broadcast</button>
        <button className="btn-primary btn-sm" onClick={() => setModal('incident')}><Plus className="h-4 w-4" /> Create Incident</button>
      </PageHeader>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Active" value={s.activeIncidents} tone="sky" icon={Activity} />
        <Metric label="Critical" value={s.criticalIncidents} tone="red" icon={TriangleAlert} pulse={s.criticalIncidents > 0} />
        <Metric label="Avail. units" value={s.availableResources} tone="green" icon={Ambulance} />
        <Metric label="Deployed" value={s.deployedResources} tone="sky" icon={ShieldCheck} />
        <Metric label="Coord. gaps" value={s.openGaps} tone="amber" icon={Bell} pulse={s.openGaps > 0} />
        <Metric label="Pending acks" value={s.pendingAcks} tone="orange" icon={Send} />
      </div>

      {/* Main operations grid */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Left: map + incident queue (dominant) */}
        <div className="space-y-4 xl:col-span-2">
          <Panel className="overflow-hidden">
            <PanelHeader title="Live Operational Map" icon={MapIcon} action={<Link href="/map" className="text-xs text-brand-300 hover:underline">Full map <ArrowUpRight className="inline h-3 w-3" /></Link>} />
            <div style={{ height: '340px' }}>
              <OpsMap state={state} filters={{ incidents: true, resources: true, facilities: true, zones: true, roads: true }} onSelectIncident={(id) => setDrawer(id)} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Incident Queue" icon={TriangleAlert} action={<Link href="/incidents" className="text-xs text-brand-300 hover:underline">View all <ArrowUpRight className="inline h-3 w-3" /></Link>} />
            {active.length === 0 ? (
              <div className="p-4"><EmptyState title="All clear" hint="No active incidents require attention." tone="positive" /></div>
            ) : (
              <div className="divide-y divide-line-soft">
                {active.slice(0, 6).map((i) => {
                  const Icon = incidentTypeIcon(i.type);
                  return (
                    <button key={i.id} onClick={() => setDrawer(i.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-raised/50">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-raised text-ink-muted"><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-ink">{i.title}</div>
                        <div className="truncate text-2xs text-ink-faint">{i.id} · {i.locationName} · {i.agencyIds.length} agencies</div>
                      </div>
                      <SeverityBadge severity={i.severity} />
                      <StatusBadge status={i.status} />
                      <span className="hidden w-14 text-right text-2xs text-ink-dim sm:block">{timeAgo(i.updatedAt)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Right rail: gaps + readiness + severity */}
        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Coordination Gaps" icon={Bell} action={<Link href="/alerts" className="text-xs text-brand-300 hover:underline">All</Link>} />
            <div className="max-h-72 space-y-2 overflow-y-auto p-3">
              {state.gaps.length === 0 ? <EmptyState title="No gaps" hint="Coordination is nominal." tone="positive" /> : state.gaps.slice(0, 5).map((g) => (
                <AlertRow key={g.id} severity={g.severity} title={g.title} detail={`→ ${g.suggestedAction}`} elapsedRef={g.elapsedRef} />
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Active Severity Mix" icon={Activity} />
            <div className="p-4">
              {active.length === 0 ? <p className="text-xs text-ink-faint">No active incidents.</p> : <DistributionBar segments={sevSegments} />}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Agency Readiness" icon={ShieldCheck} />
            <div className="space-y-2.5 p-4">
              {state.agencies.map((a) => (
                <div key={a.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
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

      {/* AI recommendations */}
      <Panel className="mt-4">
        <PanelHeader title="AI Recommendations — Human Approval Required" icon={Sparkles} action={<span className="text-2xs text-ink-faint">{pendingRecs.length} pending</span>} />
        <div className="p-3">
          {pendingRecs.length === 0 ? (
            <EmptyState title="No pending recommendations" hint="Run an agent from an incident to generate decision support." icon={Sparkles} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingRecs.slice(0, 4).map((r) => <RecommendationCard key={r.id} rec={r} />)}
            </div>
          )}
        </div>
      </Panel>

      <Modal open={modal === 'incident'} onClose={() => setModal(null)} title="Create Incident" icon={Plus} wide>
        <CreateIncidentForm onDone={() => { setModal(null); toast.push('Incident created', 'success'); }} />
      </Modal>
      <Modal open={modal === 'broadcast'} onClose={() => setModal(null)} title="Broadcast Alert" icon={Send}>
        <BroadcastForm onDone={() => { setModal(null); toast.push('Broadcast sent', 'success'); }} />
      </Modal>
      <IncidentDrawer incidentId={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="mb-5 h-9 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[86px]" />)}</div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2"><Skeleton className="h-96" /><Skeleton className="h-64" /></div>
        <div className="space-y-4"><Skeleton className="h-72" /><Skeleton className="h-40" /></div>
      </div>
    </div>
  );
}
