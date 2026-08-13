'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Building2, ShieldCheck, Eye } from 'lucide-react';

export default function RequestAccessPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', org: '', role: 'Emergency Operations', message: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend endpoint for lead capture in this environment — acknowledge locally.
    setSent(true);
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2">
      <div>
        <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand-400">Request access</div>
        <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-tight text-ink">Bring your teams onto one operational picture.</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">Tell us about your organization and we&apos;ll set you up with a ResQLink command environment for your response network.</p>
        <div className="mt-8 space-y-4">
          {[[Building2, 'For your whole response network', 'Command centers, agencies, and field teams on one shared picture.'], [ShieldCheck, 'Human-approved decisions', 'Recommendations support your commanders—never replace them.'], [Eye, 'Accountable by default', 'Every action captured in a complete audit trail.']].map(([I, t, d]) => {
            const Icon = I as any;
            return (
              <div key={t as string} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line bg-raised text-brand-300"><Icon className="h-4 w-4" /></span>
                <div><div className="text-[13px] font-semibold text-ink">{t as string}</div><div className="text-xs text-ink-muted">{d as string}</div></div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 rounded-xl border border-line/70 bg-surface/50 p-4">
          <div className="text-[13px] text-ink-muted">Already have an account?</div>
          <Link href="/login" className="btn-ghost btn-sm mt-2">Sign in <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>

      <div className="panel p-6">
        {sent ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sev-low/10 text-sev-low"><CheckCircle2 className="h-6 w-6" /></span>
            <h2 className="text-lg font-semibold text-ink">Request received</h2>
            <p className="max-w-xs text-[13px] text-ink-muted">Thanks, {form.name || 'there'}. We&apos;ll be in touch about setting up ResQLink for {form.org || 'your organization'}.</p>
            <Link href="/dashboard" className="btn-primary btn-sm mt-2">Explore the Command Center <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Work email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><label className="label">Organization</label><input className="input" required value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} placeholder="e.g. Metro Emergency Operations" /></div>
            <div>
              <label className="label">Primary role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {['Emergency Operations', 'Police', 'Fire & Rescue', 'EMS', 'Municipal Authority', 'Relief Operations', 'Other'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">What are you looking to coordinate?</label><textarea className="input min-h-[90px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your response network…" /></div>
            <button type="submit" className="btn-primary w-full">Request access <ArrowRight className="h-4 w-4" /></button>
            <p className="text-center text-2xs text-ink-faint">You can also <Link href="/dashboard" className="text-brand-300 hover:underline">enter the Command Center</Link> to explore now.</p>
          </form>
        )}
      </div>
    </section>
  );
}
