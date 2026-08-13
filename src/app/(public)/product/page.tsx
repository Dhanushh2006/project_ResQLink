import Link from 'next/link';
import { ArrowRight, MapIcon, TriangleAlert, MonitorPlay, Send, Ambulance, ListChecks, Bell, ScrollText, Cpu, Radio } from 'lucide-react';
import { PageIntro } from '@/components/public/PageIntro';
import { MockMap, MockIncident, MockComms, MockReadiness } from '@/components/public/MockUI';

export const metadata = { title: 'Product — ResQLink', description: 'One command environment for the entire response: incidents, map, resources, communications, and decisions.' };

const MODULES = [
  { icon: MonitorPlay, title: 'Situation Room', desc: 'A live command view combining the operational map, critical incidents, agency states, and coordination gaps.' },
  { icon: TriangleAlert, title: 'Incident workspace', desc: 'Every incident with its timeline, agencies, resources, tasks, and recommended next steps in one place.' },
  { icon: MapIcon, title: 'Operational map', desc: 'Incidents, responders, resources, hazards, and routes on one shared, filterable map.' },
  { icon: Ambulance, title: 'Resource coordination', desc: 'Track and deploy units across agencies with conflict-free assignment.' },
  { icon: Send, title: 'Communications', desc: 'Structured operational messaging with delivery and acknowledgement tracking.' },
  { icon: Bell, title: 'Coordination gaps', desc: 'Automatic detection of missed acknowledgements and stalled hand-offs.' },
  { icon: ListChecks, title: 'Tasks', desc: 'Assign, acknowledge, and complete field tasks with overdue detection.' },
  { icon: ScrollText, title: 'Audit trail', desc: 'A complete, timestamped record of every decision and hand-off.' },
];

export default function ProductPage() {
  return (
    <>
      <PageIntro eyebrow="Product" title="One command environment for the entire response."
        subtitle="ResQLink brings incidents, resources, communications, and decisions into a single real-time picture—so every team works from the same truth." />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><MockMap className="h-full min-h-[300px]" /></div>
          <MockIncident />
          <MockComms />
          <MockReadiness />
          <div className="panel flex flex-col justify-center p-6">
            <Cpu className="h-6 w-6 text-emerald-300" />
            <h3 className="mt-3 text-[15px] font-semibold text-ink">Recommended by ResQLink. Approved by you.</h3>
            <p className="mt-1.5 text-[13px] text-ink-muted">Contextual recommendations with reasoning and confidence—every decision stays in human hands.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-line/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-[24px] font-bold tracking-tight text-ink">Everything a response needs, connected.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="panel p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-brand-300"><Icon className="h-[18px] w-[18px]" /></span>
                  <h3 className="mt-3 text-[14px] font-semibold text-ink">{m.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">See the full picture in action.</h2>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">Enter Command Center <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/how-it-works" className="btn-ghost">How it works</Link>
        </div>
      </section>
    </>
  );
}
