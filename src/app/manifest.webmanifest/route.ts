export function GET() {
  const manifest = {
    name: 'ResQLink — Emergency Coordination',
    short_name: 'ResQLink',
    description: 'Multi-Agency Emergency Coordination & Decision Support Platform',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#070a12',
    theme_color: '#070a12',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
