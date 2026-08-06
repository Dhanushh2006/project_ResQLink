'use client';

// Fetches the consolidated state snapshot, subscribes to the SSE
// stream, and refreshes (debounced) whenever a relevant domain
// event arrives. Exposes a typed React context to all app screens.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import type {
  Agency,
  AiRecommendation,
  Alert,
  Communication,
  CoordinationGap,
  Facility,
  Incident,
  IncidentReport,
  Resource,
  RoadSegment,
  SimulationScenario,
  Task,
  Zone,
  AuditEvent,
} from '@/lib/types';

export interface OpState {
  incidents: Incident[];
  resources: Resource[];
  tasks: Task[];
  overdueTasks: string[];
  communications: Communication[];
  alerts: Alert[];
  gaps: CoordinationGap[];
  reports: IncidentReport[];
  recommendations: AiRecommendation[];
  agencies: Agency[];
  zones: Zone[];
  facilities: Facility[];
  roads: RoadSegment[];
  scenarios: SimulationScenario[];
  auditEvents: AuditEvent[];
  sim: any;
  ai: { name: string; mode: string };
  stats: {
    activeIncidents: number;
    criticalIncidents: number;
    highIncidents: number;
    availableResources: number;
    deployedResources: number;
    openGaps: number;
    openAlerts: number;
    pendingAcks: number;
  };
}

interface StoreCtx {
  state: OpState | null;
  loading: boolean;
  connected: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastEvent: string | null;
}

const Ctx = createContext<StoreCtx | null>(null);

export function useOps(): StoreCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOps must be used within OpsProvider');
  return c;
}

export function OpsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OpState | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error(`state ${res.status}`);
      }
      const json = await res.json();
      setState(json.data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(refresh, 120);
  }, [refresh]);

  useEffect(() => {
    refresh();
    const es = new EventSource('/api/stream');
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'ping') {
          setConnected(true);
          return;
        }
        setLastEvent(`${data.type}:${data.action}`);
        scheduleRefresh();
      } catch {
        /* ignore */
      }
    };
    // periodic clock refresh so "elapsed" counters advance
    const clock = setInterval(() => setLastEvent((e) => e), 1000);
    return () => {
      es.close();
      clearInterval(clock);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refresh, scheduleRefresh]);

  const value = useMemo(
    () => ({ state, loading, connected, error, refresh, lastEvent }),
    [state, loading, connected, error, refresh, lastEvent],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ---------------- API action helpers ----------------

export async function api<T = any>(
  url: string,
  method: 'POST' | 'GET' = 'POST',
  body?: unknown,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error || `Error ${res.status}` };
    return { ok: true, data: json.data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
