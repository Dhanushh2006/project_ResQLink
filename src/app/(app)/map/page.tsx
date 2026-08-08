'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Map as MapIcon, TriangleAlert, Layers, Ambulance, Building2, Hexagon, Route } from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { PageHeader, Skeleton, Panel, PanelHeader } from '@/components/UI';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { IncidentDrawer } from '@/components/IncidentDrawer';
import { incidentTypeIcon } from '@/lib/status';

const OpsMap = dynamic(() => import('@/components/OpsMap').then((m) => m.OpsMap), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

const LAYER_META: { key: any; label: string; icon: any }[] = [
  { key: 'incidents', label: 'Incidents', icon: TriangleAlert },
  { key: 'resources', label: 'Resources', icon: Ambulance },
  { key: 'facilities', label: 'Facilities', icon: Building2 },
  { key: 'zones', label: 'Zones', icon: Hexagon },
  { key: 'roads', label: 'Routes', icon: Route },
];

export default function MapPage() {
  const { state, loading } = useOps();
  const [filters, setFilters] = useState({ incidents: true, resources: true, facilities: true, zones: true, roads: true });
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);

  if (loading && !state) return <Skeleton className="h-[80vh]" />;
  if (!state) return null;

  const toggle = (k: keyof typeof filters) => setFilters((f) => ({ ...f, [k]: !f[k] }));
  const active = state.incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status));

  return (
    <div>
      <PageHeader title="Operational Map" subtitle="Shared GIS command view — incidents, resources, facilities, zones, routes" icon={MapIcon} />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Panel className="relative overflow-hidden" >
            {/* Floating layer switcher */}
            <div className="absolute left-3 top-3 z-[500] flex flex-col gap-1 rounded-xl border border-line bg-surface/90 p-1.5 shadow-panel backdrop-blur">
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint"><Layers className="h-3 w-3" /> Layers</div>
              {LAYER_META.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => toggle(key)} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${filters[key as keyof typeof filters] ? 'bg-brand-400/10 text-brand-300' : 'text-ink-faint hover:bg-raised'}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                  <span className={`ml-auto h-1.5 w-1.5 rounded-full ${filters[key as keyof typeof filters] ? 'bg-brand-400' : 'bg-ink-dim'}`} />
                </button>
              ))}
            </div>
            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[500] rounded-xl border border-line bg-surface/90 p-2.5 text-2xs shadow-panel backdrop-blur">
              <div className="mb-1.5 font-semibold uppercase tracking-wider text-ink-faint">Legend</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <Legend color="#F0475A" label="Critical" />
                <Legend color="#FB8A3C" label="High" />
                <Legend color="#3DD68C" label="Available" />
                <Legend color="#a3e635" label="Deployed" />
                <Legend color="#F0475A" label="Blocked road" line />
                <Legend color="#a3e635" label="Facility" square />
              </div>
            </div>
            <div style={{ height: '74vh' }}>
              <OpsMap state={state} filters={filters} focus={focus} onSelectIncident={(id) => setDrawer(id)} />
            </div>
          </Panel>
        </div>

        <Panel className="flex flex-col overflow-hidden" >
          <PanelHeader title="Active Incidents" subtitle={`${active.length} on map`} icon={TriangleAlert} />
          <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5" style={{ maxHeight: '74vh' }}>
            {active.length === 0 ? <p className="p-3 text-center text-xs text-ink-faint">No active incidents.</p> : active.map((i) => {
              const Icon = incidentTypeIcon(i.type);
              return (
                <div key={i.id} className="rounded-lg border border-line/70 bg-raised/40 p-2.5 transition-colors hover:border-line">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-mono text-2xs text-ink-faint"><Icon className="h-3.5 w-3.5 text-ink-muted" />{i.id}</span>
                    <SeverityBadge severity={i.severity} size="xs" />
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-ink">{i.title}</div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <button onClick={() => setFocus({ lat: i.lat, lng: i.lng })} className="text-2xs text-brand-300 hover:underline">Focus on map</button>
                    <button onClick={() => setDrawer(i.id)} className="text-2xs text-ink-faint hover:text-ink">Details →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      <IncidentDrawer incidentId={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

function Legend({ color, label, line, square }: { color: string; label: string; line?: boolean; square?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-muted">
      <span className={line ? 'h-0.5 w-3' : square ? 'h-2 w-2 rounded-sm' : 'h-2 w-2 rounded-full'} style={{ background: color }} />
      {label}
    </span>
  );
}
