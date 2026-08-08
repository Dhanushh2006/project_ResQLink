'use client';
import { useEffect, useState } from 'react';
import { Settings, User, Cpu, Wifi, Shield, Palette, Building2 } from 'lucide-react';
import { useOps } from '@/lib/client/store';
import { PageHeader, Skeleton, Panel, PanelHeader } from '@/components/UI';
import { ROLE_LABEL } from '@/lib/ui';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'ai', label: 'AI Engine', icon: Cpu },
  { key: 'connectivity', label: 'Connectivity', icon: Wifi },
  { key: 'access', label: 'Access', icon: Shield },
];

export default function SettingsPage() {
  const { state, loading, connected } = useOps();
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState('profile');
  useEffect(() => { fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((j) => j && setMe(j.data)); }, []);

  if (loading && !state) return <Skeleton className="h-96" />;
  if (!state) return null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Session, AI engine, connectivity, and access model" icon={Settings} />
      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <Panel className="h-fit p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={`nav-item w-full ${tab === t.key ? 'nav-item-on' : 'nav-item-off'}`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </Panel>

        <div className="space-y-4">
          {tab === 'profile' && (
            <Panel>
              <PanelHeader title="Your Session" icon={User} />
              <div className="space-y-1 p-4 text-sm">
                {me ? <>
                  <Row label="Name" value={me.name} />
                  <Row label="Email" value={me.email} />
                  <Row label="Role" value={ROLE_LABEL[me.role as keyof typeof ROLE_LABEL]} />
                  <Row label="Agency" value={me.agency?.name || '—'} />
                </> : <Skeleton className="h-24" />}
              </div>
            </Panel>
          )}
          {tab === 'ai' && (
            <Panel>
              <PanelHeader title="AI Decision-Support Engine" icon={Cpu} />
              <div className="space-y-3 p-4 text-sm">
                <Row label="Provider" value={state.ai.name} />
                <Row label="Mode" value={state.ai.mode === 'llm' ? 'LLM' : 'Rule-based engine'} />
                <div className="rounded-xl border border-line/70 bg-raised/40 p-3 text-xs text-ink-muted">
                  The application runs fully offline on the deterministic engine. Set <span className="kbd">AI_PROVIDER=openai</span> and
                  <span className="kbd">OPENAI_API_KEY</span> in <span className="kbd">.env.local</span> to enable a real LLM, with automatic fallback on error.
                </div>
              </div>
            </Panel>
          )}
          {tab === 'connectivity' && (
            <Panel>
              <PanelHeader title="Connectivity & Offline" icon={Wifi} />
              <div className="space-y-3 p-4 text-sm">
                <Row label="Real-time stream" value={connected ? 'Connected (SSE)' : 'Reconnecting…'} />
                <div className="rounded-xl border border-line/70 bg-raised/40 p-3 text-xs text-ink-muted">
                  ResQLink caches the app shell for degraded connectivity and auto-reconnects the live stream. Unsaved message drafts remain in the composer until sent.
                </div>
              </div>
            </Panel>
          )}
          {tab === 'access' && (
            <Panel>
              <PanelHeader title="Role Access Model" icon={Shield} />
              <div className="space-y-1.5 p-4 text-xs">
                {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-lg border border-line/60 bg-raised/40 px-3 py-2">
                    <span className="text-ink">{ROLE_LABEL[r]}</span>
                    <span className="font-mono text-2xs text-ink-dim">{r}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-line-soft py-2 last:border-0"><span className="text-ink-faint">{label}</span><span className="text-ink">{value}</span></div>;
}
