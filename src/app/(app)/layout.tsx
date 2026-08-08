import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ensureSeeded } from '@/lib/bootstrap';
import { OpsProvider } from '@/lib/client/store';
import { ToastProvider } from '@/components/Toast';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  ensureSeeded();
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <ToastProvider>
      <OpsProvider>
        <AppShell>{children}</AppShell>
      </OpsProvider>
    </ToastProvider>
  );
}
