'use client';
import { useState } from 'react';
import { Sparkles, Check, Pencil, X, ChevronDown, Ambulance, TriangleAlert, Send, Network, ScanSearch, FileText } from 'lucide-react';
import type { AiRecommendation } from '@/lib/types';
import { api, useOps } from '@/lib/client/store';
import { useToast } from './Toast';
import { timeAgo } from '@/lib/ui';

const KIND_ICON: Record<string, any> = {
  RESOURCE: Ambulance, ESCALATION: TriangleAlert, COMMUNICATION: Send,
  COORDINATION: Network, CLASSIFICATION: ScanSearch, BRIEF: FileText,
};

export function RecommendationCard({ rec, compact }: { rec: AiRecommendation; compact?: boolean }) {
  const { refresh } = useOps();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const decide = async (decision: 'APPROVED' | 'MODIFIED' | 'REJECTED') => {
    setBusy(decision);
    const res = await api(`/api/recommendations/${rec.id}/decide`, 'POST', { decision });
    setBusy(null);
    if (res.ok) {
      const applied = (res.data as any)?.applied as string[] | undefined;
      toast.push(`AI recommendation ${decision.toLowerCase()}${applied?.length ? ` — ${applied.join(', ')}` : ''}`, decision === 'REJECTED' ? 'info' : 'success');
      refresh();
    } else toast.push(res.error || 'Failed', 'error');
  };

  const decided = rec.status !== 'PENDING';
  const confPct = Math.round(rec.confidence * 100);
  const Icon = KIND_ICON[rec.kind] || Sparkles;

  return (
    <div className="group rounded-xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/[0.07] to-transparent p-3.5 transition-colors hover:border-emerald-400/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3 w-3" /> AI Recommendation
              </span>
              <span className="text-2xs text-ink-faint">· {rec.agent}</span>
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-ink">{rec.title}</div>
          </div>
        </div>
        <span className="whitespace-nowrap text-2xs text-ink-faint">{timeAgo(rec.createdAt)}</span>
      </div>

      {rec.body && !compact && <p className="mt-2 whitespace-pre-wrap pl-9 text-xs leading-relaxed text-ink-muted">{rec.body}</p>}

      <div className="mt-2.5 flex items-center gap-3 pl-9">
        <div className="flex-1">
          <div className="flex items-center justify-between text-2xs text-ink-faint">
            <span>Confidence</span><span className="tabular-nums">{confPct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
            <div className={`h-full rounded-full transition-all duration-500 ${confPct >= 75 ? 'bg-sev-low' : confPct >= 50 ? 'bg-sev-moderate' : 'bg-sev-high'}`} style={{ width: `${confPct}%` }} />
          </div>
        </div>
        {rec.rationale.length > 0 && (
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-2xs text-ink-faint hover:text-ink-muted">
            Rationale <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {open && (
        <ul className="mt-2 space-y-1 rounded-lg border border-line/60 bg-bg/40 p-2.5 pl-4 text-2xs text-ink-muted">
          {rec.rationale.map((r, i) => <li key={i} className="list-disc">{r}</li>)}
        </ul>
      )}

      {decided ? (
        <div className="mt-3 flex items-center gap-2 pl-9 text-xs">
          <span className={`chip ${rec.status === 'APPROVED' ? 'bg-sev-low/10 text-sev-low ring-1 ring-inset ring-sev-low/30' : rec.status === 'REJECTED' ? 'bg-sev-critical/10 text-sev-critical ring-1 ring-inset ring-sev-critical/30' : 'bg-sev-moderate/10 text-sev-moderate ring-1 ring-inset ring-sev-moderate/30'}`}>
            {rec.status === 'APPROVED' ? <Check className="h-3 w-3" /> : rec.status === 'REJECTED' ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {rec.status === 'APPROVED' ? 'Approved' : rec.status === 'REJECTED' ? 'Rejected' : 'Modified'}
          </span>
          <span className="text-ink-faint">by commander</span>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-9">
          <span className="mr-0.5 inline-flex items-center gap-1 rounded-md bg-sev-moderate/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-sev-moderate ring-1 ring-inset ring-sev-moderate/25">
            Human approval required
          </span>
          <button className="btn-primary btn-xs" disabled={!!busy} onClick={() => decide('APPROVED')}>
            <Check className="h-3 w-3" /> {busy === 'APPROVED' ? '…' : 'Approve'}
          </button>
          <button className="btn-ghost btn-xs" disabled={!!busy} onClick={() => decide('MODIFIED')}>
            <Pencil className="h-3 w-3" /> Modify
          </button>
          <button className="btn-ghost btn-xs" disabled={!!busy} onClick={() => decide('REJECTED')}>
            <X className="h-3 w-3" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
