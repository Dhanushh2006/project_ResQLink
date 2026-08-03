// Seed / reset the ResQLink database with deterministic demo data.
import { replaceAll } from '../src/lib/db';
import { buildSeed } from '../src/lib/seed-data';

const seed = buildSeed();
replaceAll(seed);
console.log(
  `[seed] ResQLink seeded: ${seed.agencies.length} agencies, ${seed.users.length} users, ${seed.resources.length} resources, ${seed.scenarios.length} scenarios.`,
);
console.log('[seed] Login with any demo email and password: resqlink');
