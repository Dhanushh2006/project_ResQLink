'use client';
import { Network } from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { PageHeader, Skeleton, Panel } from '@/components/UI';
import { Gauge } from '@/components/Charts';
import { pretty } from '@/lib/ui';
import { agencyTypeIcon } from '@/lib/status';

export default function AgenciesPage() {
  const { state, loading } = useOps();
  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  return (
    <div>
      <PageHeader title="Agencies" subtitle="Participating agencies, readiness, and resource footprint" icon={Network} />

      {/* Readiness matrix */}
      <Panel className="mb-4 overflow-hidden">
        <div className="border-b border-line/70 px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-ink-faint">Readiness Matrix</div>
        <div className="grid gap-px bg-line/70 sm:grid-cols-2 lg:grid-cols-3">
          {state.agencies.map((a) => {
            const Icon = agencyTypeIcon(a.type);
            const readyColor = a.readiness >= 80 ? '#3DD68C' : a.readiness >= 60 ? '#F5C147' : '#FB8A3C';
            return (
              <div key={a.id} className="flex items-center gap-3 bg-surface px-4 py-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg" style={{ background: `${a.color}1f`, color: a.color }}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink">{a.name}</div>
                  <div className="text-2xs text-ink-faint">{pretty(a.type)}</div>
                </div>
                <Gauge value={a.readiness} size={44} color={readyColor} />
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.agencies.map((a) => {
          const Icon = agencyTypeIcon(a.type);
          const resources = state.resources.filter((r) => r.agencyId === a.id);
          const deployed = resources.filter((r) => r.status === 'DEPLOYED').length;
          const incidents = state.incidents.filter((i) => i.agencyIds.includes(a.id) && !['RESOLVED', 'ARCHIVED'].includes(i.status)).length;
          const pendingAcks = state.communications.filter((c) => c.targetAgencyId === a.id && c.ackState !== 'ACKNOWLEDGED').length;
          return (
            <Panel key={a.id} className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-bg" style={{ background: a.color }}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{a.name}</div>
                  <div className="truncate text-2xs text-ink-faint">{pretty(a.type)} · {a.contact}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <Mini label="Units" value={resources.length} />
                <Mini label="Deployed" value={deployed} />
                <Mini label="Incidents" value={incidents} />
                <Mini label="Pending" value={pendingAcks} tone={pendingAcks > 0 ? 'text-sev-high' : undefined} />
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-raised/40 py-2">
      <div className={`text-lg font-bold tabular-nums ${tone || 'text-ink'}`}>{value}</div>
      <div className="text-2xs uppercase text-ink-faint">{label}</div>
    </div>
  );
}
