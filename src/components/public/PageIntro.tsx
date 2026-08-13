export function PageIntro({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <section className="border-b border-line/60">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand-400">{eyebrow}</div>
        <h1 className="mt-2 max-w-3xl text-[32px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted">{subtitle}</p>}
      </div>
    </section>
  );
}
