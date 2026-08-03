// Ensures the data store is seeded on first access so the app is
// demo-ready immediately without a manual seed step.

import { db, replaceAll } from './db';
import { buildSeed } from './seed-data';

export function ensureSeeded() {
  const data = db();
  if (!data.meta.seededAt || data.users.length === 0) {
    replaceAll(buildSeed());
  }
}
