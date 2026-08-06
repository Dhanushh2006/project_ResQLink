'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { X, MapPin, Users, Ambulance, ListChecks, Send, ArrowUpRight, Clock } from 'lucide-react';
import { api, useOps } from '@/lib/client/store';
import { Drawer, Skeleton } from './UI';
import { SeverityBadge, StatusBadge, AckBadge } from './Badges';
import { RecommendationCard } from './RecommendationCard';
import { incidentTypeIcon } from '@/lib/status';
import { clockTime, pretty } from '@/lib/ui';
import { useToast } from './Toast';

export function IncidentDrawer({ incidentId, onClose }: { incidentId: string | null; onClose: () => void }) {
  const { lastEvent, refresh } = useOps();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!incidentId) return;
    const res = await api(`/api/incidents/${incidentId}`, 'GET');
    if (res.ok) setData(res.data);
    setLoading(false);
  }, [incidentId]);

  useEffect(() => {
    if (incidentId) { setLoading(true); setData(null); load(); }
  }, [incidentId, load]);
  useEffect(() => { if (incidentId) load(); }, [lastEvent, incidentId, load]);

  const changeStatus = async (status: string) => {
    const res = await api(`/api/incidents/${incidentId}/status`, 'POST', { status });
    if (res.ok) { toast.push(`Status → ${pretty(status)}`, 'success'); load(); refresh(); }
    else toast.push(res.error || 'Failed', 'error');
  };

  const NEXT: Record<string, string[]> = {
    DETECTED: ['VERIFIED', 'ACTIVE'], VERIFICATION_REQUIRED: ['VERIFIED', 'ACTIVE'],
    VERIFIED: ['ACTIVE', 'ESCALATED'], ACTIVE: ['ESCALATED', 'STABILIZING', 'RESOLVED'],
    ESCALATED: ['STABILIZING', 'RESOLVED'], STABILIZING: ['RESOLVED'], RESOLVED: ['ARCHIVED'], ARCHIVED: [],
  };

  const inc = data?.incident;
  const Icon = inc ? incidentTypeIcon(inc.type) : MapPin;
  const agencyName = (aid: string) => data?.agencies.find((a: any) => a.id === aid)?.name || aid;

  return (
    <Drawer open={!!incidentId} onClose={onClose} width="max-w-lg" label="Incident detail">
      {loading || !inc ? (
        <div className="space-y-3 p-5"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
      ) : (
        <div>
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface/95 p-4 backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line bg-raised text-brand-300"><Icon className="h-5 w-5" strokeWidth={2} /></span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xs text-ink-faint">{inc.id}</span>
                  <SeverityBadge severity={inc.severity} />
                </div>
                <h2 className="mt-0.5 text-base font-bold text-ink">{inc.title}</h2>
                <div className="mt-0.5 flex items-center gap-1 text-2xs text-ink-faint"><MapPin className="h-3 w-3" />{inc.locationName}</div>
              </div>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={inc.status} />
              <Link href={`/incidents/${inc.id}`} className="btn-ghost btn-xs" onClick={onClose}>Open full view <ArrowUpRight className="h-3 w-3" /></Link>
            </div>

            <p className="text-[13px] leading-relaxed text-ink-muted">{inc.description}</p>

            {(NEXT[inc.status] || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-2xs text-ink-faint">Advance:</span>
                {NEXT[inc.status].map((s) => <button key={s} className="btn-ghost btn-xs" onClick={() => changeStatus(s)}>{pretty(s)}</button>)}
              </div>
            )}

            <DrawerBlock icon={Users} title={`Agencies (${inc.agencyIds.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {inc.agencyIds.length ? inc.agencyIds.map((a: string) => <span key={a} className="chip bg-raised text-ink-muted ring-1 ring-inset ring-line">{agencyName(a)}</span>) : <span className="text-xs text-ink-faint">None engaged yet</span>}
              </div>
            </DrawerBlock>

            <DrawerBlock icon={Ambulance} title={`Resources (${data.resources.length})`}>
              {data.resources.length ? (
                <div className="space-y-1.5">
                  {data.resources.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-line/70 bg-raised/40 px-2.5 py-1.5 text-xs">
                      <span className="font-medium text-ink">{r.label}</span><StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              ) : <span className="text-xs text-ink-faint">No resources deployed</span>}
            </DrawerBlock>

            {data.recommendations.filter((r: any) => r.status === 'PENDING').length > 0 && (
              <DrawerBlock icon={Send} title="AI recommendations">
                <div className="space-y-2">
                  {data.recommendations.filter((r: any) => r.status === 'PENDING').map((r: any) => <RecommendationCard key={r.id} rec={r} compact />)}
                </div>
              </DrawerBlock>
            )}

            <DrawerBlock icon={Clock} title="Latest updates">
              <div className="space-y-2">
                {data.updates.slice(0, 5).map((u: any) => (
                  <div key={u.id} className="text-xs">
                    <div className="flex items-center justify-between"><span className="font-medium text-ink-muted">{u.authorName}</span><span className="font-mono text-2xs text-ink-dim">{clockTime(u.createdAt)}</span></div>
                    <div className="text-ink-faint">{u.message}</div>
                  </div>
                ))}
              </div>
            </DrawerBlock>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function DrawerBlock({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line/70 bg-bg/30 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint"><Icon className="h-3.5 w-3.5" />{title}</div>
      {children}
    </div>
  );
}
