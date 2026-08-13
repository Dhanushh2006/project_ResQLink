'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';

const LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/security', label: 'Security' },
  { href: '/about', label: 'About' },
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? 'border-line/70 bg-bg/85 backdrop-blur' : 'border-transparent bg-transparent'}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.14em] text-ink">Res<span className="text-brand-300">Q</span>Link</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={`text-2xs font-semibold uppercase tracking-[0.16em] transition-colors ${active ? 'text-brand-300' : 'text-ink-muted hover:text-ink'}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-ghost btn-sm">Sign in</Link>
          <Link href="/request-access" className="btn-primary btn-sm">Request access <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <button className="icon-btn md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line/70 bg-surface/95 px-5 py-3 backdrop-blur md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-raised hover:text-ink">{l.label}</Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="btn-ghost btn-sm flex-1 justify-center">Sign in</Link>
              <Link href="/request-access" className="btn-primary btn-sm flex-1 justify-center">Request access</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
