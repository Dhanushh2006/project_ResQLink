import Link from 'next/link';
import { ArrowRight, Lock, Eye, GitBranch, KeyRound, ShieldCheck, FileCheck } from 'lucide-react';
import { PageIntro } from '@/components/public/PageIntro';

export const metadata = { title: 'Security — ResQLink', description: 'Access control, accountability, and resilience built into every layer of the platform.' };

const ITEMS = [
  { icon: KeyRound, title: 'Role-based access control', desc: 'Every operator sees exactly what their role requires. Capabilities are enforced on every action, not just hidden in the UI.' },
  { icon: Eye, title: 'Complete audit trail', desc: 'Every decision, hand-off, and status change is timestamped and attributed—so accountability is never in question.' },
  { icon: ShieldCheck, title: 'Human-in-the-loop by design', desc: 'Recommendations never execute on their own. High-risk actions always require explicit human approval.' },
  { icon: GitBranch, title: 'Resilient coordination', desc: 'The platform keeps working through degraded connectivity, queues updates, and reconnects automatically.' },
  { icon: Lock, title: 'Secure sessions', desc: 'Authenticated sessions with signed, expiring credentials and protected server-side validation on every request.' },
  { icon: FileCheck, title: 'Data integrity', desc: 'Structured, validated inputs and consistent state transitions keep the operational picture trustworthy.' },
];

export default function SecurityPage() {
  return (
    <>
      <PageIntro eyebrow="Security & Trust" title="Accountability built into every layer."
        subtitle="Emergency coordination demands trust. ResQLink is designed around access control, auditability, human authority, and resilience." />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((i) => {
            const Icon = i.icon;
            return (
              <div key={i.title} className="panel p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised text-brand-300"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3.5 text-[15px] font-semibold text-ink">{i.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{i.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line/60 bg-surface/30">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center">
          <p className="text-[14px] leading-relaxed text-ink-muted">
            ResQLink is engineered so operators can trust what they see and act with confidence. Access is scoped, decisions are
            recorded, and human authority is never removed from the loop.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/request-access" className="btn-primary">Request access <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/about" className="btn-ghost">About ResQLink</Link>
          </div>
        </div>
      </section>
    </>
  );
}
