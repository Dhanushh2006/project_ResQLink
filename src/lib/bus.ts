// In-process pub/sub that fans out domain events to connected
// Server-Sent Events (SSE) clients. Every mutation in the service
// layer publishes an event; the frontend subscribes via /api/stream
// and updates live (incidents, alerts, comms, resources, tasks,
// acknowledgements, gaps).

export type BusEventType =
  | 'incident'
  | 'incident_update'
  | 'report'
  | 'resource'
  | 'task'
  | 'communication'
  | 'alert'
  | 'gap'
  | 'ai_recommendation'
  | 'audit'
  | 'agency'
  | 'sim'
  | 'ping';

export interface BusEvent {
  type: BusEventType;
  action: string; // created | updated | deleted | ack | reset ...
  id?: string;
  data?: unknown;
  at: string;
}

type Subscriber = (e: BusEvent) => void;

const globalForBus = globalThis as unknown as {
  __resqlink_subs?: Set<Subscriber>;
};

function subs(): Set<Subscriber> {
  if (!globalForBus.__resqlink_subs) {
    globalForBus.__resqlink_subs = new Set();
  }
  return globalForBus.__resqlink_subs;
}

export function subscribe(fn: Subscriber): () => void {
  subs().add(fn);
  return () => {
    subs().delete(fn);
  };
}

export function publish(
  type: BusEventType,
  action: string,
  payload?: { id?: string; data?: unknown },
) {
  const event: BusEvent = {
    type,
    action,
    id: payload?.id,
    data: payload?.data,
    at: new Date().toISOString(),
  };
  for (const fn of subs()) {
    try {
      fn(event);
    } catch (err) {
      console.error('[bus] subscriber error:', err);
    }
  }
}

export function subscriberCount(): number {
  return subs().size;
}
