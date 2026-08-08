'use client';
import { useState } from 'react';
import { Plus, ListChecks, Clock, MapPin } from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { PageHeader, EmptyState, Skeleton, Modal, FilterChip, Panel } from '@/components/UI';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { useToast } from '@/components/Toast';
import { pretty } from '@/lib/ui';

const NEXT: Record<string, string[]> = {
  PENDING: ['ASSIGNED'], ASSIGNED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'BLOCKED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'BLOCKED'], IN_PROGRESS: ['COMPLETED', 'BLOCKED'],
  BLOCKED: ['IN_PROGRESS'], COMPLETED: [],
};

export default function TasksPage() {
  const { state, loading, refresh } = useOps();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [statusF, setStatusF] = useState('ALL');

  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  const agencyName = (id: string | null) => id ? (state.agencies.find((a) => a.id === id)?.name || id) : 'Unassigned';
  const incName = (id: string) => state.incidents.find((i) => i.id === id)?.title || id;
  let list = state.tasks;
  if (statusF !== 'ALL') list = list.filter((t) => t.status === statusF);

  const setStatus = async (id: string, status: string) => {
    const res = await api(`/api/tasks/${id}/status`, 'POST', { status });
    if (res.ok) { toast.push(`Task → ${pretty(status)}`, 'success'); refresh(); } else toast.push(res.error || 'Failed', 'error');
  };

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Assignment, acknowledgement, and completion tracking" icon={ListChecks}>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Create Task</button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {['ALL', 'PENDING', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].map((s) => (
          <FilterChip key={s} active={statusF === s} onClick={() => setStatusF(s)} count={s === 'ALL' ? state.tasks.length : state.tasks.filter((t) => t.status === s).length}>{pretty(s)}</FilterChip>
        ))}
      </div>

      {list.length === 0 ? <EmptyState title="No open tasks" hint="Your response queue is clear." tone="positive" icon={ListChecks} /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => {
            const overdue = state.overdueTasks.includes(t.id);
            return (
              <Panel key={t.id} className={`p-4 ${overdue ? '!border-sev-critical/40' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-semibold text-ink">{t.title}</div>
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="mt-1 flex items-center gap-1 font-mono text-2xs text-ink-faint">{t.id} · {incName(t.incidentId)}</div>
                {t.description && <p className="mt-2 text-xs text-ink-muted">{t.description}</p>}
                {t.locationName && <div className="mt-2 flex items-center gap-1 text-2xs text-ink-faint"><MapPin className="h-3 w-3" />{t.locationName}</div>}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-ink-faint">{agencyName(t.agencyId)}</span>
                  <StatusBadge status={t.status} />
                </div>
                {overdue && <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-sev-critical/10 px-2 py-1 text-2xs text-sev-critical"><Clock className="h-3 w-3" /> Overdue</div>}
                {NEXT[t.status]?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line-soft pt-3">
                    {NEXT[t.status].map((s) => <button key={s} className="btn-ghost btn-xs" onClick={() => setStatus(t.id, s)}>{pretty(s)}</button>)}
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Task" icon={Plus}>
        <CreateTaskForm onDone={() => { setModal(false); toast.push('Task created', 'success'); }} />
      </Modal>
    </div>
  );
}

function CreateTaskForm({ onDone }: { onDone: () => void }) {
  const { state, refresh } = useOps();
  const toast = useToast();
  const [form, setForm] = useState({ incidentId: '', title: '', description: '', agencyId: '', priority: 'HIGH', locationName: '', deadlineMin: 30 });
  const [busy, setBusy] = useState(false);
  const active = state?.incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status)) || [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.incidentId) { toast.push('Select an incident', 'error'); return; }
    setBusy(true);
    const deadline = form.deadlineMin ? new Date(Date.now() + form.deadlineMin * 60000).toISOString() : null;
    const res = await api('/api/tasks', 'POST', { incidentId: form.incidentId, title: form.title, description: form.description, agencyId: form.agencyId || null, priority: form.priority, locationName: form.locationName, deadline });
    setBusy(false);
    if (res.ok) { refresh(); onDone(); } else toast.push(res.error || 'Failed', 'error');
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Incident</label>
        <select className="input" value={form.incidentId} onChange={(e) => setForm({ ...form, incidentId: e.target.value })} required>
          <option value="">Select incident…</option>
          {active.map((i) => <option key={i.id} value={i.id}>{i.id} — {i.title}</option>)}
        </select>
      </div>
      <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div><label className="label">Description</label><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Assign agency</label>
          <select className="input" value={form.agencyId} onChange={(e) => setForm({ ...form, agencyId: e.target.value })}>
            <option value="">Unassigned</option>
            {state?.agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['CRITICAL', 'HIGH', 'NORMAL', 'LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Location</label><input className="input" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} /></div>
        <div><label className="label">Deadline (min)</label><input className="input" type="number" value={form.deadlineMin} onChange={(e) => setForm({ ...form, deadlineMin: Number(e.target.value) })} /></div>
      </div>
      <div className="flex justify-end pt-1"><button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create Task'}</button></div>
    </form>
  );
}
