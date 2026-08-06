'use client';
import { useState } from 'react';
import { api, useOps } from '@/lib/client/store';
import { useToast } from '@/components/Toast';

const TYPES = ['FIRE','FLOOD','COLLISION','MEDICAL','HAZMAT','STRUCTURAL','CROWD','ROAD_BLOCKAGE','UTILITY','EARTHQUAKE','MISSING_PERSON','OTHER'];
const RES_TYPES = ['AMBULANCE','FIRE_ENGINE','POLICE_UNIT','RESCUE_TEAM','MEDICAL_SUPPLIES','RELIEF_TEAM','GENERATOR','DRONE','EMERGENCY_VEHICLE','VOLUNTEER_GROUP'];

export function CreateIncidentForm({ onDone }: { onDone: () => void }) {
  const { state, refresh } = useOps();
  const toast = useToast();
  const [form, setForm] = useState({
    title: '', type: 'FIRE', severity: 'HIGH', description: '', source: 'Manual entry',
    locationName: '', lat: 12.9756, lng: 77.6016, affectedPopulation: 0,
  });
  const [agencyIds, setAgencyIds] = useState<string[]>([]);
  const [resTypes, setResTypes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const runAiPrefill = async () => {
    if (!form.description.trim()) { toast.push('Enter a description first', 'error'); return; }
    setAiBusy(true);
    // Submit a transient report to reuse the triage engine
    const res = await api('/api/reports', 'POST', {
      raw: form.description, reporter: 'Command intake', channel: 'PHONE',
      locationName: form.locationName || 'Unknown', lat: form.lat, lng: form.lng,
    });
    setAiBusy(false);
    if (res.ok && res.data) {
      const r = res.data as any;
      setForm((f) => ({
        ...f,
        type: r.category || f.type,
        severity: r.urgency === 'CRITICAL' ? 'CRITICAL' : r.urgency === 'HIGH' ? 'HIGH' : r.urgency === 'LOW' ? 'LOW' : 'MODERATE',
        title: f.title || `${(r.category || 'Incident')} — ${f.locationName || 'Reported location'}`,
      }));
      const map: Record<string, string> = { POLICE: 'AG-POL', FIRE: 'AG-FIRE', EMS: 'AG-EMS', MUNICIPAL: 'AG-MUN', RELIEF: 'AG-REL' };
      setAgencyIds((r.suggestedAgencies || []).map((a: string) => map[a]).filter(Boolean));
      toast.push(`AI triage: ${r.category} · ${Math.round((r.confidence || 0) * 100)}% confidence`, 'info');
      refresh();
    } else {
      toast.push(res.error || 'AI prefill failed', 'error');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await api('/api/incidents', 'POST', {
      ...form,
      affectedPopulation: Number(form.affectedPopulation) || 0,
      lat: Number(form.lat), lng: Number(form.lng),
      agencyIds, requiredResourceTypes: resTypes, status: 'VERIFIED',
    });
    setBusy(false);
    if (res.ok) { refresh(); onDone(); } else toast.push(res.error || 'Failed', 'error');
  };

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[70px]" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Heavy smoke near industrial area, fire spreading toward warehouse, workers may be trapped." required />
        <button type="button" className="btn-ghost btn-sm mt-2" onClick={runAiPrefill} disabled={aiBusy}>
          {aiBusy ? 'Analyzing…' : '❋ AI triage & prefill'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Severity</label>
          <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {['CRITICAL','HIGH','MODERATE','LOW'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Affected pop.</label>
          <input className="input" type="number" min="0" value={form.affectedPopulation}
            onChange={(e) => setForm({ ...form, affectedPopulation: Number(e.target.value) })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Latitude</label>
          <input className="input" type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input className="input" type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">Agencies involved</label>
        <div className="flex flex-wrap gap-1.5">
          {state?.agencies.map((a) => (
            <button type="button" key={a.id} onClick={() => toggle(agencyIds, setAgencyIds, a.id)}
              className={`filter-chip ${agencyIds.includes(a.id) ? 'filter-chip-on' : 'filter-chip-off'}`}>
              {a.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Required resources</label>
        <div className="flex flex-wrap gap-1.5">
          {RES_TYPES.map((t) => (
            <button type="button" key={t} onClick={() => toggle(resTypes, setResTypes, t)}
              className={`filter-chip ${resTypes.includes(t) ? 'filter-chip-on' : 'filter-chip-off'}`}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create Incident'}</button>
      </div>
    </form>
  );
}
