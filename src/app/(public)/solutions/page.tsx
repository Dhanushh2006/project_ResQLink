import Link from 'next/link';
import { ArrowRight, Radio, Shield, Flame, Ambulance, Building2, HeartPulse } from 'lucide-react';
import { PageIntro } from '@/components/public/PageIntro';

export const metadata = { title: 'Solutions — ResQLink', description: 'ResQLink adapts to every team in the response—from the command center to the field.' };

const SOLUTIONS = [
  { icon: Radio, title: 'Emergency Operations Centers', tone: '#a3e635', points: ['Unified command view across all agencies', 'Coordination-gap detection in real time', 'Operational briefings on demand'] },
  { icon: Shield, title: 'Police', tone: '#34d399', points: ['Perimeter, traffic, and crowd coordination', 'Unit deployment and status tracking', 'Evacuation support workflows'] },
  { icon: Flame, title: 'Fire & Rescue', tone: '#F0475A', points: ['Rapid dispatch and route guidance', 'Hazard and access-route awareness', 'Rescue task assignment and tracking'] },
  { icon: Ambulance, title: 'EMS', tone: '#3DD68C', points: ['Ambulance availability at a glance', 'Hospital destination coordination', 'Medical task prioritization'] },
  { icon: Building2, title: 'Municipal Authorities', tone: '#F5C147', points: ['Infrastructure and utility response', 'Shelter and relief coordination', 'Public communication drafting'] },
  { icon: HeartPulse, title: 'Relief Operations', tone: '#FB8A3C', points: ['Volunteer and supply coordination', 'Relief-zone management', 'Field task tracking'] },
];

export default function SolutionsPage() {
  return (
    <>
      <PageIntro eyebrow="Solutions" title="Built for every team in the response."
        subtitle="From the command center to the field, ResQLink gives each agency the view and tools its role requires—on one shared operational picture." />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="panel p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${s.tone}1f`, color: s.tone }}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3.5 text-[15px] font-semibold text-ink">{s.title}</h3>
                <ul className="mt-2.5 space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[13px] text-ink-muted">
                      <span className="mt-1.5 h-1 w-1 flex-none rounded-full" style={{ background: s.tone }} /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-[26px] font-bold tracking-tight text-ink">One platform. Every responding team.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] text-ink-muted">When every agency shares the same operational picture, coordination stops being the bottleneck.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/request-access" className="btn-primary">Request access <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/product" className="btn-ghost">Explore the product</Link>
          </div>
        </div>
      </section>
    </>
  );
}
