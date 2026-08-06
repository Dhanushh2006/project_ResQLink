'use client';
import { useState } from 'react';
import { api, useOps } from '@/lib/client/store';
import { useToast } from '@/components/Toast';

export function BroadcastForm({ onDone, incidentId }: { onDone: () => void; incidentId?: string }) {
  const { state, refresh } = useOps();
  const toast = useToast();
  const [form, setForm] = useState({
    type: 'COMMANDER_BROADCAST',
    priority: 'HIGH',
    targetAgencyId: '',
    subject: '',
    body: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await api('/api/communications', 'POST', {
      type: form.type,
      priority: form.priority,
      targetAgencyId: form.targetAgencyId || null,
      incidentId: incidentId || null,
      subject: form.subject,
      body: form.body,
    });
    setBusy(false);
    if (res.ok) { refresh(); onDone(); } else toast.push(res.error || 'Failed', 'error');
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {['COMMANDER_BROADCAST','CRITICAL_ALERT','AGENCY_MESSAGE','RESOURCE_REQUEST','ESCALATION_ALERT','INCIDENT_UPDATE','PUBLIC_DRAFT'].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['CRITICAL','HIGH','NORMAL','LOW'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Target agency (leave blank to broadcast to all)</label>
        <select className="input" value={form.targetAgencyId} onChange={(e) => setForm({ ...form, targetAgencyId: e.target.value })}>
          <option value="">All agencies (broadcast)</option>
          {state?.agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Subject</label>
        <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea className="input min-h-[90px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
      </div>
      <div className="flex justify-end pt-1">
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
      </div>
    </form>
  );
}
