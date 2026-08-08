'use client';
import { useState, useMemo } from 'react';
import { Plus, TriangleAlert, Search, ArrowUpDown, MapPin } from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { PageHeader, EmptyState, Skeleton, Modal, Panel, FilterChip } from '@/components/UI';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { CreateIncidentForm } from '@/components/forms/CreateIncidentForm';
import { IncidentDrawer } from '@/components/IncidentDrawer';
import { useToast } from '@/components/Toast';
import { timeAgo, pretty } from '@/lib/ui';
import { incidentTypeIcon } from '@/lib/status';

const SEV_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };

export default function IncidentsPage() {
  const { state, loading } = useOps();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('ALL');
  const [scope, setScope] = useState('ACTIVE');
  const [sort, setSort] = useState<'severity' | 'updated'>('severity');

  const list = useMemo(() => {
    if (!state) return [];
    let l = state.incidents;
    if (scope === 'ACTIVE') l = l.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status));
    else if (scope === 'RESOLVED') l = l.filter((i) => ['RESOLVED', 'ARCHIVED'].includes(i.status));
    if (sev !== 'ALL') l = l.filter((i) => i.severity === sev);
    if (q) l = l.filter((i) => (i.title + i.id + i.locationName + i.type).toLowerCase().includes(q.toLowerCase()));
    l = [...l].sort((a, b) => sort === 'severity' ? (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || (+new Date(b.updatedAt) - +new Date(a.updatedAt)) : +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return l;
  }, [state, scope, sev, q, sort]);

  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  const agencyName = (id: string) => state.agencies.find((a) => a.id === id)?.name || id;

  return (
    <div>
      <PageHeader title="Incidents" subtitle="Complete incident lifecycle — detection through audit" icon={TriangleAlert}>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Create Incident</button>
      </PageHeader>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input className="input w-56 pl-8" placeholder="Search incidents…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {['ACTIVE', 'ALL', 'RESOLVED'].map((s) => <FilterChip key={s} active={scope === s} onClick={() => setScope(s)}>{pretty(s)}</FilterChip>)}
        </div>
        <div className="hidden gap-1.5 sm:flex">
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((s) => <FilterChip key={s} active={sev === s} onClick={() => setSev(s)}>{s === 'ALL' ? 'All sev' : pretty(s)}</FilterChip>)}
        </div>
        <button className="btn-ghost btn-sm ml-auto" onClick={() => setSort(sort === 'severity' ? 'updated' : 'severity')}>
          <ArrowUpDown className="h-3.5 w-3.5" /> {sort === 'severity' ? 'Severity' : 'Recent'}
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No incidents match" hint="Adjust filters or create a new incident." icon={TriangleAlert} />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th className="hidden md:table-cell">Location</th>
                  <th className="hidden lg:table-cell">Agencies</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => {
                  const Icon = incidentTypeIcon(i.type);
                  return (
                    <tr key={i.id} className="cursor-pointer" onClick={() => setDrawer(i.id)}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-raised text-ink-muted"><Icon className="h-4 w-4" /></span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink">{i.title}</div>
                            <div className="font-mono text-2xs text-ink-faint">{i.id} · {pretty(i.type)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden text-xs text-ink-muted md:table-cell"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-ink-faint" />{i.locationName}</span></td>
                      <td className="hidden lg:table-cell">
                        <div className="flex -space-x-1">
                          {i.agencyIds.slice(0, 4).map((a) => (
                            <span key={a} title={agencyName(a)} className="flex h-5 w-5 items-center justify-center rounded-full border border-surface text-[8px] font-bold text-bg" style={{ background: state.agencies.find((x) => x.id === a)?.color || '#5E6B7E' }}>
                              {agencyName(a).split(' ').map((w) => w[0]).slice(0, 2).join('')}
                            </span>
                          ))}
                          {i.agencyIds.length === 0 && <span className="text-2xs text-ink-dim">—</span>}
                        </div>
                      </td>
                      <td><SeverityBadge severity={i.severity} /></td>
                      <td><StatusBadge status={i.status} /></td>
                      <td className="hidden text-2xs text-ink-dim lg:table-cell">{timeAgo(i.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Incident" icon={Plus} wide>
        <CreateIncidentForm onDone={() => { setModal(false); toast.push('Incident created', 'success'); }} />
      </Modal>
      <IncidentDrawer incidentId={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}
