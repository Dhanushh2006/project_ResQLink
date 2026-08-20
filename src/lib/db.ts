// Data layer.
//
// Typed, repository-style store persisted to a JSON file with a
// debounced write-through. The access API is intentionally narrow so
// the storage backend can be swapped (e.g. Postgres) without touching
// the service layer. Reads are linear scans, which is fine for the
// operational dataset sizes we work with (hundreds of rows).
//
// Storage location resolves in this order:
//   1. RESQLINK_DB_PATH (explicit override)
//   2. <cwd>/data/resqlink.json          when that dir is writable
//   3. <os.tmpdir>/resqlink.json         serverless (read-only cwd)
// If no location is writable the store still works in memory for the
// lifetime of the process.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DbShape } from './types';

function resolveDbPath(): string {
  if (process.env.RESQLINK_DB_PATH) return process.env.RESQLINK_DB_PATH;
  const local = path.join(process.cwd(), 'data', 'resqlink.json');
  try {
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.accessSync(path.dirname(local), fs.constants.W_OK);
    return local;
  } catch {
    // Read-only working directory (e.g. serverless): fall back to tmp.
    return path.join(os.tmpdir(), 'resqlink.json');
  }
}

const DB_PATH = resolveDbPath();

const EMPTY: DbShape = {
  users: [],
  agencies: [],
  incidents: [],
  incidentUpdates: [],
  incidentReports: [],
  resources: [],
  tasks: [],
  communications: [],
  alerts: [],
  coordinationGaps: [],
  zones: [],
  facilities: [],
  roads: [],
  aiRecommendations: [],
  auditEvents: [],
  scenarios: [],
  meta: { seededAt: '', version: '1.0.0' },
};

// Persist a single instance across Next.js hot reloads / route modules.
const globalForDb = globalThis as unknown as {
  __resqlink_db?: DbShape;
  __resqlink_dirty?: boolean;
  __resqlink_timer?: NodeJS.Timeout | null;
};

function load(): DbShape {
  if (globalForDb.__resqlink_db) return globalForDb.__resqlink_db;
  let data: DbShape = structuredClone(EMPTY);
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      data = { ...structuredClone(EMPTY), ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('[db] failed to load, starting empty:', err);
  }
  globalForDb.__resqlink_db = data;
  return data;
}

export function db(): DbShape {
  return load();
}

function flush() {
  const data = globalForDb.__resqlink_db;
  if (!data) return;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    globalForDb.__resqlink_dirty = false;
  } catch (err) {
    console.error('[db] flush failed:', err);
  }
}

/** Mark the store dirty and schedule a debounced write-through. */
export function persist() {
  globalForDb.__resqlink_dirty = true;
  if (globalForDb.__resqlink_timer) return;
  globalForDb.__resqlink_timer = setTimeout(() => {
    globalForDb.__resqlink_timer = null;
    if (globalForDb.__resqlink_dirty) flush();
  }, 150);
}

/** Force a synchronous write (used by seed scripts). */
export function persistNow() {
  flush();
}

/** Replace the entire store (used by seed / reset). */
export function replaceAll(next: DbShape) {
  globalForDb.__resqlink_db = next;
  persistNow();
}

export function resetInMemory() {
  globalForDb.__resqlink_db = undefined;
}

// ---------------- ID + time helpers ----------------

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  const t = Date.now().toString(36);
  const c = counter.toString(36).padStart(3, '0');
  const r = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${t}${c}${r}`;
}

/** Human-friendly sequential-ish code, e.g. INC-1042. */
export function code(prefix: string, seed?: number): string {
  const n = seed ?? 1000 + Math.floor(Math.random() * 9000);
  return `${prefix}-${n}`;
}

export function now(): string {
  return new Date().toISOString();
}
