import { Radio, ScanSearch, ListOrdered, Network, UserCheck, Send, Activity, TriangleAlert, CircleCheck } from 'lucide-react';

const STEPS = [
  { icon: Radio, label: 'Signal', desc: 'A report arrives' },
  { icon: ScanSearch, label: 'Understand', desc: 'Triaged instantly' },
  { icon: ListOrdered, label: 'Prioritize', desc: 'Ranked by severity' },
  { icon: Network, label: 'Coordinate', desc: 'Right agencies engaged' },
  { icon: UserCheck, label: 'Assign', desc: 'Nearest units deployed' },
  { icon: Send, label: 'Communicate', desc: 'Acknowledged in real time' },
  { icon: Activity, label: 'Monitor', desc: 'Gaps surfaced early' },
  { icon: TriangleAlert, label: 'Escalate', desc: 'On commander approval' },
  { icon: CircleCheck, label: 'Resolve', desc: 'Fully audited' },
];

export function WorkflowStrip() {
  return (
    <div className="panel p-5 sm:p-6">
      {/* Desktop: horizontal connected flow */}
      <div className="hidden lg:block">
        <div className="relative flex items-start justify-between">
          <div className="absolute left-0 right-0 top-5 h-px bg-gradient-to-r from-brand-500/10 via-brand-400/40 to-brand-500/10" aria-hidden />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative flex w-full flex-col items-center px-1 text-center">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised text-brand-300">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div className="mt-2.5 text-xs font-semibold text-ink">{s.label}</div>
                <div className="mt-0.5 text-2xs leading-tight text-ink-faint">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Mobile/tablet: vertical compact flow */}
      <div className="space-y-0 lg:hidden">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-raised text-brand-300"><Icon className="h-4 w-4" strokeWidth={2} /></span>
                {i < STEPS.length - 1 && <span className="my-0.5 h-4 w-px bg-line" />}
              </div>
              <div className={i < STEPS.length - 1 ? 'pb-1' : ''}>
                <div className="text-[13px] font-semibold text-ink">{s.label}</div>
                <div className="text-2xs text-ink-faint">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
