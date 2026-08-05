// Server-Sent Events endpoint. Each connected client receives every
// domain event published on the in-process bus, plus a keep-alive
// ping. The frontend uses this to update the operational picture
// live (incidents, alerts, comms, resources, tasks, gaps, sim).

import { subscribe } from '@/lib/bus';
import { requireSession } from '@/lib/api';
import { ensureSeeded } from '@/lib/bootstrap';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureSeeded();
  const session = await requireSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const encoder = new TextEncoder();
  let unsub: (() => void) | null = null;
  let ping: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* controller closed */
        }
      };
      send({ type: 'ping', action: 'hello', at: new Date().toISOString() });
      unsub = subscribe(send);
      ping = setInterval(() => send({ type: 'ping', action: 'keepalive', at: new Date().toISOString() }), 20000);
    },
    cancel() {
      if (unsub) unsub();
      if (ping) clearInterval(ping);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
