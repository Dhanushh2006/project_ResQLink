import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
      <Logo className="h-12 w-12" />
      <div className="text-4xl font-bold text-ink">404</div>
      <p className="max-w-sm text-[13px] text-ink-muted">This operational view doesn&apos;t exist. It may have been resolved, archived, or never created.</p>
      <div className="flex gap-2">
        <Link href="/dashboard" className="btn-primary btn-sm">Command Center</Link>
        <Link href="/" className="btn-ghost btn-sm">Landing</Link>
      </div>
    </div>
  );
}
