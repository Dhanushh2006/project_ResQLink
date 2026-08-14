# ResQLink

**Multi-agency emergency coordination and decision-support platform.**
_One Link. Every Response._

ResQLink gives emergency teams a single, live operational picture of incidents,
resources, communications, and decisions — so police, fire, EMS, municipal, and
relief units coordinate from the same information when it matters most.

---

## Highlights

- **Unified command center** — active incidents, resources, agency readiness, and open coordination gaps in one view.
- **Incident lifecycle** — `DETECTED → VERIFICATION_REQUIRED → VERIFIED → ACTIVE → ESCALATED → STABILIZING → RESOLVED → ARCHIVED`, with a full per-incident timeline.
- **Coordination gap detection** — surfaces missed acknowledgements, unengaged agencies, unaccepted/overdue tasks, and resource shortages in real time.
- **Structured communications** — agency messaging with `Sent → Delivered → Acknowledged` tracking.
- **Decision support** — a rule-based intelligence layer (optionally an LLM) recommends actions with reasoning and confidence; a human approves, modifies, or rejects every one.
- **Operational map** — incidents, responders, resources, hospitals, shelters, hazard zones, and routes on one shared map.
- **Audit trail** — every significant action (human and recommended) is timestamped and attributable.
- **Real-time** — state changes propagate to all connected clients over Server-Sent Events.

## Tech stack

- **Next.js (App Router)** + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **Leaflet** + OpenStreetMap tiles for the operational map
- **jose** for JWT sessions, **zod** for input validation
- **Vitest** for tests

## Getting started

Requirements: Node.js 18.18+ and npm.

```bash
npm install
cp .env.example .env.local   # optional; app runs without any keys
npm run seed                 # load sample data (also auto-seeds on first run)
npm run dev                  # http://localhost:3000
```

Sample accounts (password `resqlink`):

| Role                | Email                       |
| ------------------- | --------------------------- |
| Incident Commander  | `commander@resqlink.demo`   |
| Fire & Rescue       | `fire@resqlink.demo`        |
| EMS                 | `ems@resqlink.demo`         |
| Police              | `police@resqlink.demo`      |
| Municipal           | `municipal@resqlink.demo`   |
| Field Responder     | `field@resqlink.demo`       |
| Relief Operations   | `relief@resqlink.demo`      |
| Administrator       | `admin@resqlink.demo`       |

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start the dev server                 |
| `npm run build`  | Production build                     |
| `npm start`      | Serve the production build           |
| `npm run seed`   | Load sample data                     |
| `npm test`       | Run the test suite                   |

## Configuration

All environment variables are optional — see [`.env.example`](./.env.example).

| Variable                  | Purpose                                         | Default                       |
| ------------------------- | ----------------------------------------------- | ----------------------------- |
| `AUTH_SECRET`             | Signs session JWTs (set in production)          | built-in dev secret           |
| `RESQLINK_DB_PATH`        | Path to the data store file                     | `./data/resqlink.json`        |
| `AI_PROVIDER`             | `local` (rule engine) or `openai`               | `local`                       |
| `OPENAI_API_KEY`          | Key for the LLM provider (if `openai`)          | —                             |
| `OPENAI_BASE_URL`         | Override the LLM endpoint                        | `https://api.openai.com/v1`   |
| `OPENAI_MODEL`            | Model name                                      | `gpt-4o-mini`                 |
| `NEXT_PUBLIC_MAP_TILE_URL`| Custom map tile URL template                    | OpenStreetMap                 |

The intelligence layer sits behind an `AiProvider` interface
(`src/lib/ai`). The default `local` implementation is a deterministic
rule engine; set `AI_PROVIDER=openai` with a key to use an LLM, which
falls back to the rule engine on any error.

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md). In brief:

- **Route handlers** (`src/app/api`) are thin controllers: validate with zod, enforce role-based access, call a service.
- **Services** (`src/lib/services`) hold the domain logic and emit audit + real-time events.
- **Data access** (`src/lib/db.ts`) is a typed repository over a JSON store, swappable for SQL.
- **Event bus** (`src/lib/bus.ts`) fans domain events to SSE clients via `/api/stream`.

## Testing

```bash
npm test
```

Covers the intelligence engine, authorization matrix, resource-conflict
prevention, coordination-gap detection, and the end-to-end response
workflow (report → triage → verify → coordinate → assign → communicate →
escalate → resolve → audit).

## Project structure

```
src/
  app/                 Routes (pages + API handlers)
    (public)/          Marketing pages
    (app)/             Authenticated application
    api/               REST-style endpoints
  components/          UI components
  lib/
    ai/                Provider interface + implementations
    services/          Domain logic
    db.ts bus.ts auth.ts audit.ts ...
scripts/seed.ts        Sample data
tests/                 Vitest suites
```

## Notes

The default data store is a JSON-backed repository, chosen to keep the
project dependency-light and runnable anywhere. Storage and the event
bus sit behind narrow interfaces, so a multi-instance deployment can
back them with Postgres and Redis without changing the service layer.

## License

MIT
