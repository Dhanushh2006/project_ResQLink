'use client';
import { useState, useMemo } from 'react';
import { Ambulance, Search, Truck, Ban, RotateCcw, MapPin } from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { PageHeader, Metric, EmptyState, Skeleton, Modal, Panel, FilterChip } from '@/components/UI';
import { StatusBadge } from '@/components/Badges';
import { useToast } from '@/components/Toast';
import { pretty } from '@/lib/ui';
import { resourceTypeIcon } from '@/lib/status';

export default function ResourcesPage() {
  const { state, loading, refresh } = useOps();
  const toast = useToast();
  const [assign, setAssign] = useState<any>(null);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('ALL');

  const list = useMemo(() => {
    if (!state) return [];
    let l = state.resources;
    if (statusF !== 'ALL') l = l.filter((r) => r.status === statusF);
    if (q) l = l.filter((r) => (r.label + r.type + r.locationName).toLowerCase().includes(q.toLowerCase()));
    return l;
  }, [state, statusF, q]);

  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  const agencyName = (id: string) => state.agencies.find((a) => a.id === id)?.name || id;
  const incName = (id: string | null) => id ? (state.incidents.find((i) => i.id === id)?.title || id) : '—';
  const counts = {
    available: state.resources.filter((r) => r.status === 'AVAILABLE').length,
    deployed: state.resources.filter((r) => r.status === 'DEPLOYED').length,
    offline: state.resources.filter((r) => ['OFFLINE', 'MAINTENANCE'].includes(r.status)).length,
  };
  const utilization = Math.round((counts.deployed / Math.max(1, state.resources.length)) * 100);

  const doAssign = async (incidentId: string) => {
    const res = await api(`/api/resources/${assign.id}/assign`, 'POST', { incidentId });
    if (res.ok) { toast.push(`${assign.label} deployed`, 'success'); setAssign(null); refresh(); } else toast.push(res.error || 'Assignment failed', 'error');
  };
  const release = async (id: string) => { const res = await api(`/api/resources/${id}/release`, 'POST'); if (res.ok) { toast.push('Resource released', 'success'); refresh(); } else toast.push(res.error || 'Failed', 'error'); };
  const setStatus = async (id: string, status: string) => { const res = await api(`/api/resources/${id}/status`, 'POST', { status }); if (res.ok) refresh(); else toast.push(res.error || 'Failed', 'error'); };

  const activeIncidents = state.incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status));

  return (
    <div>
      <PageHeader title="Resources" subtitle="Multi-agency resource coordination with conflict prevention" icon={Ambulance} />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Available" value={counts.available} tone="green" />
        <Metric label="Deployed" value={counts.deployed} tone="sky" />
        <Metric label="Offline / Maint." value={counts.offline} tone="slate" />
        <Metric label="Utilization" value={`${utilization}%`} tone="indigo" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input className="input w-52 pl-8" placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'AVAILABLE', 'DEPLOYED', 'OFFLINE', 'MAINTENANCE'].map((s) => <FilterChip key={s} active={statusF === s} onClick={() => setStatusF(s)}>{s === 'ALL' ? 'All' : pretty(s)}</FilterChip>)}
        </div>
      </div>

      {list.length === 0 ? <EmptyState title="No resources match" icon={Ambulance} /> : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th className="hidden sm:table-cell">Agency</th>
                  <th className="hidden md:table-cell">Location</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Assignment</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const Icon = resourceTypeIcon(r.type);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-raised text-ink-muted"><Icon className="h-4 w-4" /></span>
                          <div><div className="font-medium text-ink">{r.label}</div><div className="text-2xs text-ink-faint">{pretty(r.type)} · cap {r.capacity}</div></div>
                        </div>
                      </td>
                      <td className="hidden text-xs text-ink-muted sm:table-cell">{agencyName(r.agencyId)}</td>
                      <td className="hidden text-xs text-ink-muted md:table-cell"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-ink-faint" />{r.locationName}</span></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="hidden text-xs text-ink-muted lg:table-cell">{incName(r.assignedIncidentId)}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          {r.status === 'AVAILABLE' && <button className="btn-primary btn-xs" onClick={() => setAssign(r)}><Truck className="h-3 w-3" /> Assign</button>}
                          {r.status === 'DEPLOYED' && <button className="btn-ghost btn-xs" onClick={() => release(r.id)}>Release</button>}
                          {r.status !== 'OFFLINE' ? <button className="btn-ghost btn-xs" onClick={() => setStatus(r.id, 'OFFLINE')}><Ban className="h-3 w-3" /></button> : <button className="btn-ghost btn-xs" onClick={() => setStatus(r.id, 'AVAILABLE')}><RotateCcw className="h-3 w-3" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Modal open={!!assign} onClose={() => setAssign(null)} title={`Assign ${assign?.label || ''}`} icon={Truck}>
        <p className="mb-3 text-xs text-ink-muted">Select an active incident to deploy this {assign && pretty(assign.type)}.</p>
        {activeIncidents.length === 0 ? <EmptyState title="No active incidents" /> : (
          <div className="space-y-2">
            {activeIncidents.map((i) => (
              <button key={i.id} onClick={() => doAssign(i.id)} className="flex w-full items-center justify-between rounded-lg border border-line/70 bg-raised/40 px-3 py-2 text-left text-sm transition-colors hover:bg-overlay">
                <span><span className="font-medium text-ink">{i.title}</span><br /><span className="font-mono text-2xs text-ink-faint">{i.id} · {i.locationName}</span></span>
                <StatusBadge status={i.severity} />
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
