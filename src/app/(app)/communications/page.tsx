'use client';
import { useState } from 'react';
import { Plus, Send, Check } from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { PageHeader, EmptyState, Skeleton, Modal, FilterChip, Panel, PanelHeader, Metric } from '@/components/UI';
import { PriorityBadge, AckBadge } from '@/components/Badges';
import { AckFunnel } from '@/components/Charts';
import { BroadcastForm } from '@/components/forms/BroadcastForm';
import { useToast } from '@/components/Toast';
import { pretty, clockTime } from '@/lib/ui';

export default function CommunicationsPage() {
  const { state, loading, refresh } = useOps();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('ALL');

  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  const agencyName = (id: string | null) => id ? (state.agencies.find((a) => a.id === id)?.name || id) : 'All agencies';
  let list = state.communications;
  if (filter === 'PENDING') list = list.filter((c) => c.ackState !== 'ACKNOWLEDGED' && (c.priority === 'HIGH' || c.priority === 'CRITICAL'));
  else if (filter !== 'ALL') list = list.filter((c) => c.priority === filter);

  const ack = async (id: string) => { const res = await api(`/api/communications/${id}/ack`, 'POST'); if (res.ok) { toast.push('Acknowledged', 'success'); refresh(); } else toast.push(res.error || 'Failed', 'error'); };

  const funnel = {
    sent: state.communications.length,
    delivered: state.communications.filter((c) => c.ackState !== 'SENT').length,
    acknowledged: state.communications.filter((c) => c.ackState === 'ACKNOWLEDGED').length,
  };

  return (
    <div>
      <PageHeader title="Communications" subtitle="Structured operational messaging — Sent → Delivered → Acknowledged" icon={Send}>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}><Plus className="h-4 w-4" /> New Message</button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-3">
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'PENDING', 'CRITICAL', 'HIGH', 'NORMAL', 'LOW'].map((f) => <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>{pretty(f)}</FilterChip>)}
          </div>
          {list.length === 0 ? <EmptyState title="No communications" hint="Send a message or run the demo." icon={Send} /> : (
            <div className="space-y-2">
              {list.map((c) => (
                <Panel key={c.id} className={`p-4 ${c.priority === 'CRITICAL' ? '!border-sev-critical/40' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{c.subject}</span>
                        <PriorityBadge priority={c.priority} />
                        <span className="chip bg-raised text-ink-faint ring-1 ring-inset ring-line">{pretty(c.type)}</span>
                      </div>
                      <div className="mt-1 text-2xs text-ink-faint">{c.senderName} → {agencyName(c.targetAgencyId)} · {clockTime(c.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AckBadge state={c.ackState} />
                      {c.ackState !== 'ACKNOWLEDGED' && <button className="btn-ghost btn-xs" onClick={() => ack(c.id)}><Check className="h-3 w-3" /> Ack</button>}
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">{c.body}</p>
                  <div className="mt-3 flex items-center gap-1">
                    {['SENT', 'DELIVERED', 'ACKNOWLEDGED'].map((stage, idx) => {
                      const order = ['SENT', 'DELIVERED', 'ACKNOWLEDGED'];
                      const reached = order.indexOf(c.ackState) >= idx;
                      return (
                        <span key={stage} className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${reached ? 'bg-sev-low' : 'bg-line'}`} />
                          <span className={`text-2xs ${reached ? 'text-ink-muted' : 'text-ink-dim'}`}>{pretty(stage)}</span>
                          {idx < 2 && <span className={`mx-1 h-px w-6 ${reached ? 'bg-sev-low/50' : 'bg-line'}`} />}
                        </span>
                      );
                    })}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Metric label="Total sent" value={funnel.sent} tone="sky" />
            <Metric label="Pending acks" value={state.stats.pendingAcks} tone="orange" pulse={state.stats.pendingAcks > 0} />
          </div>
          <Panel>
            <PanelHeader title="Acknowledgement Funnel" icon={Check} />
            <div className="p-4"><AckFunnel {...funnel} /></div>
          </Panel>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Communication" icon={Send}>
        <BroadcastForm onDone={() => { setModal(false); toast.push('Message sent', 'success'); }} />
      </Modal>
    </div>
  );
}
