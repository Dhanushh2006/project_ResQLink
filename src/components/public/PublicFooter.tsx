import Link from 'next/link';
import { Logo } from '@/components/Logo';

const COLUMNS = [
  { title: 'Product', links: [['Overview', '/product'], ['How it works', '/how-it-works'], ['Command Center', '/login'], ['Situation Room', '/login']] },
  { title: 'Solutions', links: [['Emergency Operations', '/solutions'], ['Fire & Rescue', '/solutions'], ['EMS', '/solutions'], ['Municipal', '/solutions']] },
  { title: 'Company', links: [['About', '/about'], ['Security', '/security'], ['Request access', '/request-access'], ['Sign in', '/login']] },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-line/70 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-[15px] font-bold tracking-tight text-ink">ResQLink</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-muted">Emergency coordination, connected. One shared operational picture for every response.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-[13px] text-ink-muted transition-colors hover:text-ink">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line/70 pt-6 text-2xs text-ink-faint sm:flex-row">
          <span>© 2026 ResQLink. Emergency coordination, connected.</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sev-low" /> One Link. Every Response.</span>
        </div>
      </div>
    </footer>
  );
}
