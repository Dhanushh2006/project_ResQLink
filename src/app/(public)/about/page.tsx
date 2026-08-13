import Link from 'next/link';
import { ArrowRight, Target, Users, Zap } from 'lucide-react';
import { PageIntro } from '@/components/public/PageIntro';

export const metadata = { title: 'About — ResQLink', description: 'Why ResQLink exists: because coordination, not capability, is what most often fails in a crisis.' };

export default function AboutPage() {
  return (
    <>
      <PageIntro eyebrow="About" title="When every second counts, coordination shouldn’t."
        subtitle="ResQLink exists because in most large-scale emergencies, it isn’t capability that fails—it’s coordination between the teams responding." />

      <section className="mx-auto max-w-3xl px-5 py-14">
        <div className="space-y-6 text-[14px] leading-relaxed text-ink-muted">
          <p>Emergencies are never handled by one team alone. Police, fire, EMS, municipal authorities, and relief organizations all respond to the same event—yet each works from a different view, on different channels.</p>
          <p>That fragmentation is where response slows down. The same event is reported many times. A required team is never notified. A critical message goes unacknowledged and no one notices. Units sit idle because their status is invisible to everyone else.</p>
          <p>ResQLink was built to close that gap. It turns scattered signals into one shared operational picture, surfaces coordination problems the moment they appear, and supports faster decisions—while keeping people firmly in command.</p>
          <p className="text-ink">The principle is simple: <span className="font-semibold">everyone responding to the same emergency should see the same operational picture.</span></p>
        </div>
      </section>

      <section className="border-t border-line/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-6 md:grid-cols-3">
            {[[Target, 'Our focus', 'Coordination, situational awareness, and decision support for multi-agency response.'], [Users, 'Who it’s for', 'Emergency operations centers and the agencies that respond alongside them.'], [Zap, 'Why it matters', 'Faster, clearer coordination saves time—and time saves lives.']].map(([I, t, d]) => {
              const Icon = I as any;
              return (
                <div key={t as string}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised text-brand-300"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-3 text-[15px] font-semibold text-ink">{t as string}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">One Link. Every Response.</h2>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">Enter Command Center <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/request-access" className="btn-ghost">Request access</Link>
        </div>
      </section>
    </>
  );
}
