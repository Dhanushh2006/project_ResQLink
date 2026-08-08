'use client';
import { useState } from 'react';
import { Plus, Radio, Sparkles, AlertTriangle, Link2 } from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { PageHeader, EmptyState, Skeleton, Modal, Panel } from '@/components/UI';
import { StatusBadge } from '@/components/Badges';
import { useToast } from '@/components/Toast';
import { pretty, timeAgo } from '@/lib/ui';
import { incidentTypeIcon } from '@/lib/status';

export default function ReportsPage() {
  const { state, loading, refresh } = useOps();
  const toast = useToast();
  const [modal, setModal] = useState(false);

  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  const setStatus = async (id: string, status: string) => { const res = await api(`/api/reports/${id}/status`, 'POST', { status }); if (res.ok) refresh(); else toast.push(res.error || 'Failed', 'error'); };
  const createIncident = async (id: string) => { const res = await api(`/api/reports/${id}/link`, 'POST', { createNew: true }); if (res.ok) { toast.push('Incident created from report', 'success'); refresh(); } else toast.push(res.error || 'Failed', 'error'); };
  const linkTo = async (id: string, incidentId: string) => { const res = await api(`/api/reports/${id}/link`, 'POST', { incidentId }); if (res.ok) { toast.push('Report linked', 'success'); refresh(); } else toast.push(res.error || 'Failed', 'error'); };

  const active = state.incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status));

  return (
    <div>
      <PageHeader title="Field & Citizen Reports" subtitle="Inbound reports with AI triage — verify before treating as fact" icon={Radio}>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Submit Report</button>
      </PageHeader>

      {state.reports.length === 0 ? <EmptyState title="No reports yet" hint="Submit a report or run the demo." icon={Radio} /> : (
        <div className="space-y-3">
          {state.reports.map((r) => {
            const Icon = r.category ? incidentTypeIcon(r.category) : Radio;
            return (
              <Panel key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line bg-raised text-ink-muted"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={r.status} />
                        <span className="chip bg-raised text-ink-faint ring-1 ring-inset ring-line">{r.channel}</span>
                        <span className="text-2xs text-ink-faint">{r.reporter} · {r.locationName} · {timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-[13px] text-ink">{r.raw}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-emerald-300"><Sparkles className="h-3 w-3" /> AI Triage</div>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <TriageItem label="Category" value={r.category ? pretty(r.category) : '—'} />
                    <TriageItem label="Urgency" value={r.urgency || '—'} />
                    <TriageItem label="Confidence" value={r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '—'} />
                    <TriageItem label="Duplicate" value={r.duplicateLikelihood != null ? `${Math.round(r.duplicateLikelihood * 100)}%` : '—'} />
                  </div>
                  {r.suggestedAgencies.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{r.suggestedAgencies.map((a) => <span key={a} className="chip bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-400/30">{a}</span>)}</div>}
                  {r.suggestedAction && <div className="mt-2 text-xs text-emerald-200">→ {r.suggestedAction}</div>}
                  {(r.duplicateLikelihood || 0) > 0.3 && <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-sev-moderate/10 px-2 py-1 text-2xs text-sev-moderate"><AlertTriangle className="h-3 w-3" /> Possibly related to an existing incident — review before creating a duplicate.</div>}
                </div>

                {r.status !== 'LINKED' && r.status !== 'REJECTED' && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {r.status === 'UNVERIFIED' && <button className="btn-ghost btn-xs" onClick={() => setStatus(r.id, 'UNDER_REVIEW')}>Mark under review</button>}
                    <button className="btn-ghost btn-xs" onClick={() => setStatus(r.id, 'VERIFIED')}>Verify</button>
                    <button className="btn-primary btn-xs" onClick={() => createIncident(r.id)}><Plus className="h-3 w-3" /> Create Incident</button>
                    {active.length > 0 && (
                      <select className="input !w-auto !py-1 text-xs" defaultValue="" onChange={(e) => e.target.value && linkTo(r.id, e.target.value)}>
                        <option value="">Link to incident…</option>
                        {active.map((i) => <option key={i.id} value={i.id}>{i.id} — {i.title}</option>)}
                      </select>
                    )}
                    <button className="btn-ghost btn-xs ml-auto" onClick={() => setStatus(r.id, 'REJECTED')}>Reject</button>
                  </div>
                )}
                {r.linkedIncidentId && <div className="mt-2 flex items-center gap-1.5 text-xs text-sev-low"><Link2 className="h-3.5 w-3.5" /> Linked to {r.linkedIncidentId}</div>}
              </Panel>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Submit Report" icon={Radio}>
        <SubmitReportForm onDone={() => { setModal(false); toast.push('Report submitted & triaged', 'success'); }} />
      </Modal>
    </div>
  );
}

function TriageItem({ label, value }: { label: string; value: string }) {
  return <div><div className="text-2xs uppercase text-ink-faint">{label}</div><div className="mt-0.5 text-[13px] font-medium text-ink">{value}</div></div>;
}

function SubmitReportForm({ onDone }: { onDone: () => void }) {
  const { refresh } = useOps();
  const toast = useToast();
  const [form, setForm] = useState({ raw: '', reporter: 'Citizen', channel: 'CITIZEN', locationName: '', lat: 12.9776, lng: 77.6036 });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const res = await api('/api/reports', 'POST', { ...form, lat: Number(form.lat), lng: Number(form.lng) });
    setBusy(false);
    if (res.ok) { refresh(); onDone(); } else toast.push(res.error || 'Failed', 'error');
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div><label className="label">What are you reporting?</label><textarea className="input min-h-[80px]" value={form.raw} onChange={(e) => setForm({ ...form, raw: e.target.value })} placeholder="Describe what you see…" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Reporter</label><input className="input" value={form.reporter} onChange={(e) => setForm({ ...form, reporter: e.target.value })} /></div>
        <div><label className="label">Channel</label><select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>{['CITIZEN', 'FIELD', 'RADIO', 'SENSOR', 'PHONE'].map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <div><label className="label">Location</label><input className="input" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} required /></div>
      <div className="flex justify-end pt-1"><button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit & Triage'}</button></div>
    </form>
  );
}
