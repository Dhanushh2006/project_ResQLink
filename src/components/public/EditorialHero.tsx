'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Radio, Send, Map as MapIcon } from 'lucide-react';
import { AppPreview } from './AppPreview';

const SLIDES = [
  { kicker: 'Unified command', line1: 'ONE', line2: 'PICTURE', blurb: 'Every incident, resource, and message in a single live operational view—shared by every responding agency.' },
  { kicker: 'Live coordination', line1: 'EVERY', line2: 'SECOND', blurb: 'Coordination gaps surface the moment they appear, so the right team acts before time is lost.' },
  { kicker: 'Human command', line1: 'YOU', line2: 'DECIDE', blurb: 'ResQLink recommends the next move with clear reasoning. Commanders approve every action.' },
];

export function EditorialHero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((s) => (s + 1) % SLIDES.length), 5200);
    return () => clearInterval(t);
  }, []);
  const s = SLIDES[i];

  return (
    <section className="relative overflow-hidden border-b border-line/60">
      {/* Left index bar */}
      <div className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        <span className="display-index text-2xl text-brand-300">0{i + 1}</span>
        <span className="h-16 w-px bg-line" />
        <span className="rotate-180 text-2xs uppercase tracking-[0.3em] text-ink-faint [writing-mode:vertical-rl]">Live Ops</span>
      </div>
      {/* Right social/icon rail */}
      <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
        {[Radio, Send, MapIcon].map((I, k) => (
          <span key={k} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-faint"><I className="h-3.5 w-3.5" /></span>
        ))}
        <span className="mt-1 h-16 w-px bg-line" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-12 lg:px-16 lg:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Copy */}
          <div key={i} className="animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="display-index text-xl text-brand-300">0{i + 1}</span>
              <span className="h-px w-10 bg-brand-400/60" />
              <span className="text-2xs font-semibold uppercase tracking-[0.24em] text-brand-300">{s.kicker}</span>
            </div>
            <h1 className="mt-4 font-poster text-[64px] leading-[0.9] text-ink sm:text-[80px]">
              {s.line1}<br /><span className="text-brand-300">{s.line2}</span>
            </h1>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-ink-muted">{s.blurb}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="btn-primary">Enter Command Center <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/how-it-works" className="btn-ghost">See how it works</Link>
            </div>
            {/* Progress dots + dividers */}
            <div className="mt-9 flex items-center gap-3">
              {SLIDES.map((_, k) => (
                <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className="flex items-center gap-3">
                  <span className={`display-index text-sm ${k === i ? 'text-brand-300' : 'text-ink-dim'}`}>0{k + 1}</span>
                  <span className={`h-px transition-all ${k === i ? 'w-10 bg-brand-400' : 'w-6 bg-line'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Product visual */}
          <div className="relative">
            <AppPreview />
          </div>
        </div>

        {/* Oversized poster wordmark (overlapping baseline) */}
        <div className="pointer-events-none relative mt-6 select-none lg:-mt-2">
          <div className="font-poster text-[clamp(3.5rem,17vw,13rem)] leading-[0.82] text-ink/95">
            RESQLINK<span className="text-brand-300">.</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-line/60 pt-2 text-2xs uppercase tracking-[0.24em] text-ink-faint">
            <span>One Link. Every Response.</span>
            <span className="hidden sm:inline">Multi-agency coordination platform</span>
          </div>
        </div>
      </div>
    </section>
  );
}
