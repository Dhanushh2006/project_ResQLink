import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageIntro } from '@/components/public/PageIntro';
import { WorkflowStrip } from '@/components/public/WorkflowStrip';
import { MockIncident, MockGap, MockComms } from '@/components/public/MockUI';

export const metadata = { title: 'How it works — ResQLink', description: 'From first signal to full resolution—one operational loop that keeps every team moving together.' };

const STAGES = [
  { n: '01', t: 'A signal arrives', d: 'Reports come in from citizens, field teams, radio, or sensors—each captured in one intake.' },
  { n: '02', t: 'Understood instantly', d: 'ResQLink classifies category, severity, and the agencies likely needed, and flags missing information.' },
  { n: '03', t: 'Verified and coordinated', d: 'A commander confirms the incident; the right agencies are engaged and resources recommended.' },
  { n: '04', t: 'Communicated and tracked', d: 'Structured messages go out with delivery and acknowledgement tracking—gaps surface automatically.' },
  { n: '05', t: 'Escalated on approval', d: 'When conditions worsen, ResQLink recommends escalation; the commander approves the next move.' },
  { n: '06', t: 'Resolved and audited', d: 'The incident stabilizes and resolves—every action captured in a complete audit trail.' },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro eyebrow="How it works" title="From first signal to full resolution."
        subtitle="One operational loop keeps every team moving together—each step visible, coordinated, and accountable." />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <WorkflowStrip />
      </section>

      <section className="border-t border-line/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              {STAGES.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="text-xl font-bold text-brand-400/40">{s.n}</div>
                  <div><h3 className="text-[15px] font-semibold text-ink">{s.t}</h3><p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{s.d}</p></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <MockIncident />
              <MockGap />
              <MockComms />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">Experience the full loop.</h2>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">Enter Command Center <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/product" className="btn-ghost">See the product</Link>
        </div>
      </section>
    </>
  );
}
