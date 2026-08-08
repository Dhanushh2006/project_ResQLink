'use client';
import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, MapPin, Sparkles, Send, Users, Ambulance, ListChecks,
  Radio, Clock, Cpu, Network, TriangleAlert, Route, ScanSearch, MessageSquare,
} from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { PageHeader, Section, Skeleton, EmptyState, Modal, Panel, PanelHeader } from '@/components/UI';
import { SeverityBadge, StatusBadge, PriorityBadge, AckBadge } from '@/components/Badges';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Timeline } from '@/components/OpsPrimitives';
import { useToast } from '@/components/Toast';
import { clockTime, pretty } from '@/lib/ui';
import { incidentTypeIcon } from '@/lib/status';
import { BroadcastForm } from '@/components/forms/BroadcastForm';

const NEXT_STATUS: Record<string, string[]> = {
  DETECTED: ['VERIFICATION_REQUIRED', 'VERIFIED', 'ACTIVE'],
  VERIFICATION_REQUIRED: ['VERIFIED', 'ACTIVE'],
  VERIFIED: ['ACTIVE', 'ESCALATED'],
  ACTIVE: ['ESCALATED', 'STABILIZING', 'RESOLVED'],
  ESCALATED: ['STABILIZING', 'ACTIVE', 'RESOLVED'],
  STABILIZING: ['RESOLVED', 'ESCALATED'],
  RESOLVED: ['ARCHIVED'], ARCHIVED: [],
};

const AGENTS = [
  { key: 'intelligence', label: 'Intelligence', icon: ScanSearch },
  { key: 'coordination', label: 'Coordination', icon: Network },
  { key: 'resource', label: 'Resources', icon: Ambulance },
  { key: 'route', label: 'Route', icon: Route },
  { key: 'escalation', label: 'Escalation', icon: TriangleAlert },
];

export default function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lastEvent, refresh: refreshGlobal } = useOps();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [commModal, setCommModal] = useState(false);

  const load = useCallback(async () => {
    const res = await api(`/api/incidents/${id}`, 'GET');
    if (res.ok) setData(res.data);
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load, lastEvent]);

  if (loading && !data) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState title="Incident not found" icon={TriangleAlert} />;

  const inc = data.incident;
  const Icon = incidentTypeIcon(inc.type);
  const agencyName = (aid: string) => data.agencies.find((a: any) => a.id === aid)?.name || aid;

  const runAgent = async (agent: string, extra?: any) => {
    setBusy(agent);
    const res = await api(`/api/incidents/${id}/agents`, 'POST', { agent, ...extra });
    setBusy(null);
    if (res.ok) { toast.push(`${pretty(agent)} agent produced a recommendation`, 'success'); load(); refreshGlobal(); }
    else toast.push(res.error || 'Agent failed', 'error');
  };
  const changeStatus = async (status: string) => {
    const res = await api(`/api/incidents/${id}/status`, 'POST', { status });
    if (res.ok) { toast.push(`Status → ${pretty(status)}`, 'success'); load(); refreshGlobal(); } else toast.push(res.error || 'Failed', 'error');
  };
  const addNote = async () => {
    if (!note.trim()) return;
    const res = await api(`/api/incidents/${id}/updates`, 'POST', { message: note, kind: 'NOTE' });
    if (res.ok) { setNote(''); load(); } else toast.push(res.error || 'Failed', 'error');
  };
  const genSummary = async () => {
    setBusy('summary');
    const res = await api(`/api/incidents/${id}/summary`, 'POST');
    setBusy(null);
    if (res.ok) { toast.push('AI summary generated', 'success'); load(); }
  };

  const pendingRecs = data.recommendations.filter((r: any) => r.status === 'PENDING');
  const decidedRecs = data.recommendations.filter((r: any) => r.status !== 'PENDING');
  const timelineItems = data.updates.map((u: any) => ({ id: u.id, kind: u.kind, title: `${u.kind} · ${u.authorName}`, message: u.message, at: u.createdAt }));

  return (
    <div>
      <Link href="/incidents" className="mb-2 inline-flex items-center gap-1 text-2xs text-ink-faint hover:text-ink-muted"><ChevronLeft className="h-3 w-3" /> Incidents</Link>

      {/* Hero header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line/70 bg-surface p-4">
        <div className="flex items-start gap-3.5">
          <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl border ${inc.severity === 'CRITICAL' ? 'border-sev-critical/40 bg-sev-critical/10 text-sev-critical' : 'border-line bg-raised text-brand-300'}`}>
            <Icon className="h-6 w-6" strokeWidth={2} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ink-faint">{inc.id}</span>
              <SeverityBadge severity={inc.severity} />
              <StatusBadge status={inc.status} />
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-ink">{inc.title}</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted"><MapPin className="h-3.5 w-3.5 text-ink-faint" />{inc.locationName} · {pretty(inc.type)}</div>
          </div>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setCommModal(true)}><Send className="h-4 w-4" /> Message agencies</button>
      </div>

      {/* Status transition bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line/70 bg-raised/40 px-4 py-2.5">
        <span className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Advance status</span>
        {(NEXT_STATUS[inc.status] || []).map((s) => <button key={s} className="btn-ghost btn-xs" onClick={() => changeStatus(s)}>{pretty(s)}</button>)}
        {(NEXT_STATUS[inc.status] || []).length === 0 && <span className="text-xs text-ink-faint">No further transitions.</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Incident Overview" icon={Radio} action={<button className="btn-ghost btn-xs" onClick={genSummary} disabled={busy === 'summary'}><Sparkles className="h-3 w-3" /> {busy === 'summary' ? '…' : 'AI Summary'}</button>}>
            <p className="text-[13px] leading-relaxed text-ink-muted">{inc.description}</p>
            {inc.aiSummary && (
              <div className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-500/5 p-3 text-xs text-ink-muted">
                <span className="font-semibold text-emerald-300">AI Summary: </span>{inc.aiSummary}
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Meta label="Source" value={inc.source} />
              <Meta label="Detected" value={clockTime(inc.detectedAt)} />
              <Meta label="Affected pop." value={String(inc.affectedPopulation)} />
              <Meta label="Commander" value={inc.commanderId || '—'} />
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <div className="label">Agencies engaged</div>
                <div className="flex flex-wrap gap-1.5">
                  {inc.agencyIds.length ? inc.agencyIds.map((a: string) => <span key={a} className="chip bg-raised text-ink-muted ring-1 ring-inset ring-line">{agencyName(a)}</span>) : <span className="text-xs text-ink-faint">None yet</span>}
                </div>
              </div>
              <div>
                <div className="label">Required resources</div>
                <div className="flex flex-wrap gap-1.5">
                  {inc.requiredResourceTypes.length ? inc.requiredResourceTypes.map((t: string) => <span key={t} className="chip bg-raised text-ink-faint ring-1 ring-inset ring-line">{pretty(t)}</span>) : <span className="text-xs text-ink-faint">Unspecified</span>}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Multi-Agent Decision Support" icon={Cpu} action={<span className="text-2xs uppercase tracking-wider text-ink-dim">8-agent architecture</span>}>
            <div className="flex flex-wrap gap-2">
              {AGENTS.map((a) => {
                const AIcon = a.icon;
                return <button key={a.key} className="btn-ghost btn-sm" disabled={busy === a.key} onClick={() => runAgent(a.key)}><AIcon className="h-3.5 w-3.5" /> {busy === a.key ? '…' : a.label}</button>;
              })}
              <button className="btn-ghost btn-sm" disabled={busy === 'communication'} onClick={() => runAgent('communication', { audience: 'AGENCY', agency: 'FIRE' })}><MessageSquare className="h-3.5 w-3.5" /> {busy === 'communication' ? '…' : 'Draft Message'}</button>
            </div>
            <p className="mt-2 text-2xs text-ink-faint">Agents produce recommendations. A human commander approves, modifies, or rejects each one below.</p>
            <div className="mt-4 space-y-3">
              {pendingRecs.length === 0 ? <EmptyState title="No pending recommendations" hint="Run an agent to generate decision support." icon={Sparkles} /> : pendingRecs.map((r: any) => <RecommendationCard key={r.id} rec={r} />)}
            </div>
            {decidedRecs.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-ink-faint hover:text-ink-muted">Decision history ({decidedRecs.length})</summary>
                <div className="mt-2 space-y-2">{decidedRecs.map((r: any) => <RecommendationCard key={r.id} rec={r} />)}</div>
              </details>
            )}
          </Section>

          <Section title="Operational Timeline" icon={Clock}>
            <Timeline items={timelineItems} />
            <div className="mt-4 flex gap-2">
              <input className="input" placeholder="Add an operational note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <button className="btn-ghost btn-sm" onClick={addNote}>Add</button>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <SidePanel title={`Deployed Resources (${data.resources.length})`} icon={Ambulance} empty={data.resources.length === 0} emptyText="None deployed">
            {data.resources.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-line/70 bg-raised/40 px-2.5 py-2 text-xs">
                <div><div className="font-medium text-ink">{r.label}</div><div className="text-2xs text-ink-faint">{pretty(r.type)}</div></div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </SidePanel>

          <SidePanel title={`Tasks (${data.tasks.length})`} icon={ListChecks} empty={data.tasks.length === 0} emptyText="No tasks" footer={<Link href="/tasks" className="btn-ghost btn-xs w-full justify-center">Manage tasks</Link>}>
            {data.tasks.map((t: any) => (
              <div key={t.id} className="rounded-lg border border-line/70 bg-raised/40 p-2 text-xs">
                <div className="flex items-center justify-between"><span className="font-medium text-ink">{t.title}</span><PriorityBadge priority={t.priority} /></div>
                <div className="mt-1 flex items-center justify-between"><span className="font-mono text-2xs text-ink-faint">{t.id}</span><StatusBadge status={t.status} /></div>
              </div>
            ))}
          </SidePanel>

          <SidePanel title={`Communications (${data.communications.length})`} icon={Send} empty={data.communications.length === 0} emptyText="No messages">
            {data.communications.map((c: any) => (
              <div key={c.id} className="rounded-lg border border-line/70 bg-raised/40 p-2 text-xs">
                <div className="flex items-center justify-between gap-2"><span className="truncate font-medium text-ink">{c.subject}</span><PriorityBadge priority={c.priority} /></div>
                <div className="mt-1 flex items-center justify-between"><span className="text-2xs text-ink-faint">{c.targetAgencyId ? agencyName(c.targetAgencyId) : 'Broadcast'}</span><AckBadge state={c.ackState} /></div>
              </div>
            ))}
          </SidePanel>

          <SidePanel title={`Linked Reports (${data.reports.length})`} icon={Radio} empty={data.reports.length === 0} emptyText="No linked reports">
            {data.reports.map((r: any) => <div key={r.id} className="rounded-lg border border-line/70 bg-raised/40 p-2 text-xs text-ink-muted">{r.raw}</div>)}
          </SidePanel>
        </div>
      </div>

      <Modal open={commModal} onClose={() => setCommModal(false)} title="Message Agencies" icon={Send}>
        <BroadcastForm incidentId={inc.id} onDone={() => { setCommModal(false); toast.push('Message sent', 'success'); load(); }} />
      </Modal>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><div className="text-2xs uppercase tracking-wide text-ink-faint">{label}</div><div className="mt-0.5 text-[13px] text-ink">{value}</div></div>;
}

function SidePanel({ title, icon, children, empty, emptyText, footer }: { title: string; icon: any; children: React.ReactNode; empty?: boolean; emptyText?: string; footer?: React.ReactNode }) {
  const Icon = icon;
  return (
    <Panel>
      <PanelHeader title={title} icon={Icon} />
      <div className="space-y-2 p-3">
        {empty ? <p className="py-3 text-center text-xs text-ink-faint">{emptyText}</p> : children}
        {footer}
      </div>
    </Panel>
  );
}
