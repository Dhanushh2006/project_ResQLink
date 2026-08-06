'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, Bell } from 'lucide-react';

type Kind = 'success' | 'error' | 'info' | 'alert';
type Toast = { id: number; message: string; kind: Kind };
const Ctx = createContext<{ push: (m: string, k?: Kind) => void } | null>(null);

export function useToast() {
  return useContext(Ctx) || { push: () => {} };
}

const STYLE: Record<Kind, { cls: string; icon: any }> = {
  success: { cls: 'border-sev-low/40 bg-sev-low/10 text-sev-low', icon: CheckCircle2 },
  error: { cls: 'border-sev-critical/40 bg-sev-critical/10 text-sev-critical', icon: XCircle },
  info: { cls: 'border-brand-400/40 bg-brand-400/10 text-brand-200', icon: Info },
  alert: { cls: 'border-sev-high/40 bg-sev-high/10 text-sev-high', icon: Bell },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Kind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[22rem] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const s = STYLE[t.kind];
          const Icon = s.icon;
          return (
            <div key={t.id} className={`animate-slideInUp pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] shadow-panel backdrop-blur ${s.cls}`}>
              <Icon className="mt-px h-4 w-4 flex-none" strokeWidth={2.2} />
              <span className="text-ink">{t.message}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
