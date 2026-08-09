import Link from 'next/link';
import { ArrowLeft, Rocket, Star, Users, Cpu, Keyboard, Accessibility } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const metadata = { title: 'ResQLink — Help & Guide' };

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line/70 bg-surface/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5"><Logo className="h-7 w-7" /><span className="font-bold text-ink">ResQLink</span></Link>
          <div className="flex gap-2">
            <Link href="/login" className="btn-ghost btn-sm">Sign in</Link>
            <Link href="/dashboard" className="btn-primary btn-sm">Command Center</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Help &amp; Guide</h1>
          <p className="mt-1 text-[13px] text-ink-muted">Everything you need to run and demonstrate ResQLink.</p>
        </div>

        <Card icon={Rocket} title="Getting started">
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px] text-ink-muted">
            <li>Sign in with a demo account (password <span className="kbd">resqlink</span>). The Incident Commander sees the full experience.</li>
            <li>Open <b className="text-ink">Demo Control</b> and click <b className="text-ink">Run Full Scenario</b> to auto-play the Industrial Fire scenario.</li>
            <li>Watch the <b className="text-ink">Situation Room</b>, <b className="text-ink">Coordination Gaps</b>, and <b className="text-ink">Audit Trail</b> update live.</li>
          </ol>
        </Card>

        <Card icon={Star} title="Key features">
          <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-ink-muted">
            <li><b className="text-ink">Unified Command Center</b> — one operational picture across all agencies.</li>
            <li><b className="text-ink">Multi-Agent Decision Support</b> — eight specialized agents produce recommendations.</li>
            <li><b className="text-ink">Coordination Gap Detection</b> — missing acknowledgements, unengaged agencies, overdue tasks.</li>
            <li><b className="text-ink">Real-Time Agency Communication</b> — Sent → Delivered → Acknowledged tracking.</li>
            <li><b className="text-ink">Human-in-the-Loop Response</b> — AI recommends; commanders approve, modify, or reject.</li>
          </ul>
        </Card>

        <Card icon={Keyboard} title="Keyboard shortcuts">
          <div className="grid grid-cols-2 gap-2 text-[13px] text-ink-muted sm:grid-cols-3">
            {[['⌘K / Ctrl K', 'Command palette'], ['/', 'Search'], ['D', 'Dashboard'], ['S', 'Situation Room'], ['C', 'Incidents'], ['M', 'Map'], ['R', 'Resources'], ['T', 'Tasks'], ['A', 'Alerts'], ['Esc', 'Close drawer']].map(([k, l]) => (
              <div key={l} className="flex items-center gap-2"><span className="kbd">{k}</span> <span>{l}</span></div>
            ))}
          </div>
        </Card>

        <Card icon={Users} title="Roles">
          <p className="text-[13px] text-ink-muted">Each role has scoped capabilities. Incident Commander and System Admin have the broadest authority (verify, escalate, decide on AI recommendations, control the demo). Coordinators manage their agency&apos;s incidents, resources, tasks, and messages. Field Responders update task status.</p>
        </Card>

        <Card icon={Cpu} title="AI engine">
          <p className="text-[13px] text-ink-muted">ResQLink uses a built-in rule-based engine by default, so no external key is required. To use an LLM instead, set <span className="kbd">AI_PROVIDER=openai</span> and <span className="kbd">OPENAI_API_KEY</span>. It falls back to the rule-based engine automatically on any error.</p>
        </Card>

        <Card icon={Accessibility} title="Accessibility">
          <p className="text-[13px] text-ink-muted">Modals and drawers close with <span className="kbd">Esc</span>. All interactive elements are keyboard-focusable with visible focus rings. Status is conveyed with both color and text/icon so it remains readable under stress and for color-blind users.</p>
        </Card>

        <Link href="/" className="inline-flex items-center gap-1.5 text-2xs text-ink-faint hover:text-ink-muted"><ArrowLeft className="h-3 w-3" /> Back to landing</Link>
      </main>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink"><Icon className="h-4 w-4 text-brand-300" /> {title}</h2>
      {children}
    </section>
  );
}
