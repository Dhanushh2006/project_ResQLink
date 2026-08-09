'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Radio, Shield, Ambulance, Building2, HeartPulse, Cpu, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-bg text-ink-faint">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

const DEMO_ACCOUNTS = [
  { email: 'commander@resqlink.demo', role: 'Incident Commander', icon: Radio, primary: true },
  { email: 'fire@resqlink.demo', role: 'Fire & Rescue', icon: Radio },
  { email: 'ems@resqlink.demo', role: 'EMS', icon: Ambulance },
  { email: 'police@resqlink.demo', role: 'Police', icon: Shield },
  { email: 'municipal@resqlink.demo', role: 'Municipal', icon: Building2 },
  { email: 'relief@resqlink.demo', role: 'Relief Ops', icon: HeartPulse },
];

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('commander@resqlink.demo');
  const [password, setPassword] = useState('resqlink');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) { router.push(params.get('next') || '/dashboard'); router.refresh(); }
    else setError(json.error || 'Login failed');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden border-r border-line/60 bg-surface/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <div>
              <div className="text-base font-bold tracking-tight text-ink">ResQLink</div>
              <div className="text-2xs uppercase tracking-[0.18em] text-brand-400">One Link. Every Response.</div>
            </div>
          </Link>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">The command center for coordinated emergency response.</h1>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">
            One shared operational picture across police, fire, EMS, municipal, and relief agencies — with AI decision support and human command.
          </p>
          <div className="mt-8 space-y-3">
            {[[Radio, 'Unified command center'], [Cpu, 'Multi-agent decision support'], [Shield, 'Human-in-the-loop, fully audited']].map(([I, t]) => {
              const Icon = I as any;
              return (
                <div key={t as string} className="flex items-center gap-3 text-[13px] text-ink-muted">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-brand-300"><Icon className="h-4 w-4" /></span>
                  {t as string}
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative text-2xs text-ink-dim">Secure access to your response network.</div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-9 w-9" />
              <span className="text-base font-bold tracking-tight text-ink">ResQLink</span>
            </Link>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Sign in to Command Center</h2>
          <p className="mt-1 text-[13px] text-ink-muted">Use a demo account below, or enter credentials.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            {error && <div className="rounded-lg border border-sev-critical/40 bg-sev-critical/10 px-3 py-2 text-xs text-sev-critical" role="alert">{error}</div>}
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : <>Enter Command Center <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Demo accounts</span>
              <span className="text-2xs text-ink-dim">password: <span className="kbd">resqlink</span></span>
            </div>
            <div className="grid gap-1.5">
              {DEMO_ACCOUNTS.map((a) => {
                const Icon = a.icon;
                const on = email === a.email;
                return (
                  <button key={a.email} onClick={() => { setEmail(a.email); setPassword('resqlink'); }}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${on ? 'border-brand-400/50 bg-brand-400/10' : 'border-line/70 bg-surface/50 hover:bg-raised/60'}`}>
                    <Icon className={`h-4 w-4 ${on ? 'text-brand-300' : 'text-ink-faint'}`} />
                    <span className="flex-1">
                      <span className="font-medium text-ink">{a.role}</span>
                      {a.primary && <span className="ml-2 rounded bg-brand-400/15 px-1 text-[9px] font-bold uppercase text-brand-300">Full access</span>}
                    </span>
                    <span className="text-ink-dim">{a.email.split('@')[0]}</span>
                    <ChevronRight className={`h-3.5 w-3.5 ${on ? 'text-brand-300' : 'text-ink-dim'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-2xs text-ink-faint hover:text-ink-muted">
            <ArrowLeft className="h-3 w-3" /> Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
