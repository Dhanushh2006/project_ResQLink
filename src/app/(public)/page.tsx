import Link from 'next/link';
import {
  ArrowRight, Phone, Radio, FileText, Car, Bell, Network, ArrowDown,
  Layers, Clock, ShieldCheck, Cpu, Send, Map as MapIcon,
  Activity, Lock, Eye, GitBranch, Check,
} from 'lucide-react';
import { AppPreview } from '@/components/public/AppPreview';
import { MockIncident, MockComms, MockReadiness, MockGap } from '@/components/public/MockUI';
import { WorkflowStrip } from '@/components/public/WorkflowStrip';
import { EditorialHero } from '@/components/public/EditorialHero';

export const metadata = {
  title: 'ResQLink — One operational picture for every response',
  description: 'ResQLink gives emergency teams a shared view of incidents, resources, communications, and decisions—so teams coordinate faster when every second matters.',
};

export default function Home() {
  return (
    <>
      <EditorialHero />

      {/* Trust band */}
      <section className="border-y border-line/60 bg-surface/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-5 text-2xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          <span>Emergency Operations Centers</span><Dot />
          <span>Fire &amp; Rescue</span><Dot />
          <span>EMS</span><Dot />
          <span>Police</span><Dot />
          <span>Municipal Authorities</span><Dot />
          <span>Relief Operations</span>
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow n="02">The problem</Eyebrow>
            <Title>Response breaks down between the lines.</Title>
            <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink-muted">
              Every agency sees a different slice of the same emergency. Signals arrive on separate channels, hand-offs slip,
              and coordination gaps go unnoticed until it&apos;s too late.
            </p>
            <div className="mt-6 space-y-3">
              {[[Layers, 'No shared picture', 'Each team works from its own view of the incident.'], [Clock, 'Silent gaps', 'A missed acknowledgement can stall the entire response.'], [Network, 'Slow hand-offs', 'Reaching the right team takes calls, not clicks.']].map(([I, t, d]) => {
                const Icon = I as any;
                return (
                  <div key={t as string} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line bg-surface text-ink-muted"><Icon className="h-4 w-4" /></span>
                    <div><div className="text-[13px] font-semibold text-ink">{t as string}</div><div className="text-xs text-ink-muted">{d as string}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-line/70 bg-surface p-6">
            <div className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Fragmented signals</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[[Phone, 'Calls'], [Radio, 'Radio'], [FileText, 'Reports'], [Car, 'Traffic'], [Send, 'Messages'], [Bell, 'Alerts']].map(([I, l]) => {
                const Icon = I as any;
                return <div key={l as string} className="flex flex-col items-center gap-1.5 rounded-lg border border-line/70 bg-raised/40 py-3 text-2xs text-ink-muted"><Icon className="h-4 w-4 text-ink-faint" />{l as string}</div>;
              })}
            </div>
            <div className="my-3 flex justify-center"><ArrowDown className="h-4 w-4 text-ink-dim" /></div>
            <div className="flex items-center justify-center gap-2 rounded-lg border border-brand-400/40 bg-brand-400/10 py-2.5 text-[13px] font-semibold text-brand-300"><Network className="h-4 w-4" /> ResQLink</div>
            <div className="my-3 flex justify-center"><ArrowDown className="h-4 w-4 text-ink-dim" /></div>
            <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-ink">One shared operational picture</div>
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <section className="border-y border-line/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="max-w-2xl">
            <Eyebrow n="03">The unified picture</Eyebrow>
            <Title>Every response signal, connected.</Title>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">Incidents, resources, communications, and decisions in one live command environment—shared by every agency in the response.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MockIncident />
            <MockGap />
            <MockComms />
            <MockReadiness />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-2xl">
          <Eyebrow n="04">How it works</Eyebrow>
          <Title>From first signal to full resolution.</Title>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">A single operational loop keeps every team moving together—each step visible, coordinated, and accountable.</p>
        </div>
        <div className="mt-10"><WorkflowStrip /></div>
        <div className="mt-8">
          <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-300 hover:text-brand-200">Explore the full workflow <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-y border-line/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="max-w-2xl"><Eyebrow n="05">Capabilities</Eyebrow><Title>Built for the moments that matter.</Title></div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line/70 bg-line/70 sm:grid-cols-2 lg:grid-cols-3">
            <Capability icon={MapIcon} title="Unified command center">Live incidents, resources, and agency status in one operational view.</Capability>
            <Capability icon={Cpu} title="Intelligent decision support">Recommendations with reasoning and confidence—approved by you, never automatic.</Capability>
            <Capability icon={Bell} title="Coordination gap detection">Surfaces missed acknowledgements and stalled hand-offs before they cost time.</Capability>
            <Capability icon={Send} title="Operational communication">Structured agency messaging with delivery and acknowledgement tracking.</Capability>
            <Capability icon={Activity} title="Live operational map">Incidents, responders, hazards, and routes on one shared map.</Capability>
            <Capability icon={ShieldCheck} title="Accountability by default">Every action—human and recommended—captured in a complete audit trail.</Capability>
          </div>
        </div>
      </section>

      {/* Decision support */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow n="06">Decision support</Eyebrow>
            <Title>Recommended by ResQLink. Approved by you.</Title>
            <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink-muted">
              ResQLink interprets the operational picture and recommends the next move—with the reasoning and confidence behind it.
              Commanders stay in control of every decision.
            </p>
            <ul className="mt-6 space-y-2.5">
              {['Clear reasoning and evidence behind every recommendation', 'Approve, modify, or reject in one click', 'Nothing high-risk happens without human authority'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] text-ink-muted"><Check className="mt-0.5 h-4 w-4 flex-none text-brand-300" /> {t}</li>
              ))}
            </ul>
          </div>
          <MockIncident />
        </div>
      </section>

      {/* Security */}
      <section className="border-y border-line/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <TrustItem icon={Lock} title="Role-based access">Every operator sees exactly what their role requires—nothing more.</TrustItem>
            <TrustItem icon={Eye} title="Complete audit trail">Every decision and hand-off is timestamped and accountable.</TrustItem>
            <TrustItem icon={GitBranch} title="Resilient by design">Keeps coordinating through degraded connectivity and reconnects automatically.</TrustItem>
          </div>
          <div className="mt-8"><Link href="/security" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-300 hover:text-brand-200">Learn about security <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-[28px] font-extrabold uppercase tracking-tight text-ink">Coordinate the response.</h2>
            <p className="mt-2 text-[14px] text-ink-muted">Step into the ResQLink Command Center and see the full operational picture in action.</p>
          </div>
          <div className="flex flex-none gap-3">
            <Link href="/dashboard" className="btn-primary">Enter Command Center <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/request-access" className="btn-ghost">Request access</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Dot() { return <span className="text-ink-dim">·</span>; }
function Eyebrow({ children, n }: { children: React.ReactNode; n?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {n && <span className="display-index text-lg text-brand-400">{n}</span>}
      <span className="text-2xs font-semibold uppercase tracking-[0.18em] text-brand-400">{children}</span>
    </div>
  );
}
function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-2 font-display text-[26px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[32px]">{children}</h2>;
}
function Capability({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface p-5 transition-colors hover:bg-raised/40">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-brand-300"><Icon className="h-[18px] w-[18px]" strokeWidth={2} /></span>
      <h3 className="mt-3.5 text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
function TrustItem({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-brand-300"><Icon className="h-[18px] w-[18px]" /></span>
      <h3 className="mt-3 text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
