'use client';
import { useState } from 'react';
import { ScrollText, Search, Sparkles } from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { PageHeader, EmptyState, Skeleton, Panel } from '@/components/UI';
import { clockTime, pretty } from '@/lib/ui';

export default function AuditPage() {
  const { state, loading } = useOps();
  const [q, setQ] = useState('');
  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  let list = state.auditEvents;
  if (q) list = list.filter((e) => (e.action + e.userName + e.entityType + (e.detail || '') + (e.incidentId || '')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Audit Trail" subtitle="Every significant action — human and AI — logged for accountability" icon={ScrollText} />
      <div className="mb-3 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input className="input w-64 pl-8" placeholder="Search audit events…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="text-2xs text-ink-faint">{list.length} event(s)</span>
      </div>

      {list.length === 0 ? <EmptyState title="No audit events" icon={ScrollText} /> : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Time</th><th>Actor</th><th>Action</th>
                  <th className="hidden md:table-cell">Entity</th>
                  <th className="hidden lg:table-cell">Transition</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const isAI = e.action.startsWith('AI_');
                  return (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap font-mono text-2xs text-ink-faint">{clockTime(e.createdAt)}</td>
                      <td className="text-xs"><div className="font-medium text-ink">{e.userName}</div><div className="text-2xs text-ink-dim">{pretty(e.role)}</div></td>
                      <td>
                        <span className={`chip ${isAI ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30' : 'bg-raised text-ink-muted ring-1 ring-inset ring-line'}`}>
                          {isAI && <Sparkles className="h-2.5 w-2.5" />}{e.action}
                        </span>
                      </td>
                      <td className="hidden text-xs text-ink-muted md:table-cell">{e.entityType}{e.entityId ? ` · ${e.entityId}` : ''}</td>
                      <td className="hidden text-xs lg:table-cell">{e.fromState || e.toState ? <span className="font-mono text-ink-muted">{e.fromState || '—'} → {e.toState || '—'}</span> : <span className="text-ink-dim">—</span>}</td>
                      <td className="text-xs text-ink-muted">{e.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
