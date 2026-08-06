import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResQLink — Emergency Coordination Command Center',
  description:
    'ResQLink — Multi-Agency Emergency Coordination & Decision Support Platform. One Link. Every Response.',
  applicationName: 'ResQLink',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0E1608',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Archivo:wght@500;600;700;800;900&family=Anton&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
