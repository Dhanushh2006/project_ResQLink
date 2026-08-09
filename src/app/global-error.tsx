'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#070a12', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Something went wrong</div>
          <p style={{ color: '#94a3b8', maxWidth: 420, fontSize: 14 }}>
            ResQLink hit an unexpected error. Your data is safe. Try again, or return to the command center.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ background: '#a3e635', color: '#070a12', border: 0, borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
            <a href="/dashboard" style={{ border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', color: '#e2e8f0', textDecoration: 'none' }}>Command Center</a>
          </div>
        </div>
      </body>
    </html>
  );
}
