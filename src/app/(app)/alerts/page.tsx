'use client';
import { Bell, Network, Check } from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { PageHeader, EmptyState, Skeleton, Panel, PanelHeader } from '@/components/UI';
import { AlertRow } from '@/components/OpsPrimitives';
import { useToast } from '@/components/Toast';
import { pretty } from '@/lib/ui';

export default function AlertsPage() {
  const { state, loading, refresh } = useOps();
  const toast = useToast();
  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  const openAlerts = state.alerts.filter((a) => a.status !== 'RESOLVED');
  const resolveGap = async (id: string) => { const res = await api(`/api/gaps/${id}/resolve`, 'POST'); if (res.ok) { toast.push('Gap resolved', 'success'); refresh(); } else toast.push(res.error || 'Failed', 'error'); };
  const resolveAlert = async (id: string, ack = false) => { const res = await api(`/api/alerts/${id}/resolve${ack ? '?ack=1' : ''}`, 'POST'); if (res.ok) { toast.push(ack ? 'Acknowledged' : 'Resolved', 'success'); refresh(); } else toast.push(res.error || 'Failed', 'error'); };

  return (
    <div>
      <PageHeader title="Alerts & Coordination Gaps" subtitle="Automatic detection of coordination problems across agencies" icon={Bell} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title={`Coordination Gaps (${state.gaps.length})`} icon={Network} action={<span className="chip bg-sev-high/10 text-sev-high ring-1 ring-inset ring-sev-high/25">Auto-detected</span>} />
          <div className="space-y-2 p-3">
            {state.gaps.length === 0 ? <EmptyState title="All clear" hint="Coordination is nominal across all agencies." tone="positive" /> : state.gaps.map((g) => (
              <AlertRow key={g.id} severity={g.severity} title={g.title} detail={g.detail} elapsedRef={g.elapsedRef} meta={pretty(g.type)}
                actions={<><span className="text-2xs text-sev-high">→ {g.suggestedAction}</span><button className="btn-ghost btn-xs ml-auto" onClick={() => resolveGap(g.id)}>Resolve</button></>} />
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title={`Alerts (${openAlerts.length})`} icon={Bell} action={<span className="chip bg-raised text-ink-faint ring-1 ring-inset ring-line">Rule engine</span>} />
          <div className="space-y-2 p-3">
            {openAlerts.length === 0 ? <EmptyState title="No open alerts" tone="positive" /> : openAlerts.map((a) => (
              <AlertRow key={a.id} severity={a.severity} title={a.title} detail={a.detail} meta={`rule: ${a.rule}`}
                actions={<>{a.status === 'OPEN' && <button className="btn-ghost btn-xs" onClick={() => resolveAlert(a.id, true)}><Check className="h-3 w-3" /> Acknowledge</button>}<button className="btn-ghost btn-xs" onClick={() => resolveAlert(a.id)}>Resolve</button></>} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
