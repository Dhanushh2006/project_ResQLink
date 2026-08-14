# ResQLink — Architecture

_Multi-Agency Emergency Coordination & Decision Support Platform_

This document describes the system architecture, the multi-agent AI layer, data flow, real-time flow, database structure, security model, and deployment architecture.

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                              │
│   React 19 Client Components · Tailwind UI · Leaflet map               │
│   OpsProvider (global store)  ──subscribes──►  EventSource /api/stream │
│        │  fetch /api/state (snapshot)                 ▲                │
└────────┼──────────────────────────────────────────────┼───────────────┘
         │ HTTPS (relative URLs)                         │ SSE events
┌────────▼──────────────────────────────────────────────┼───────────────┐
│                    Next.js Server (App Router)          │               │
│                                                         │               │
│  Middleware (auth gate)                                 │               │
│                                                         │               │
│  API Route Handlers  ── thin controllers ──┐           │               │
│    /api/incidents, /resources, /tasks,      │           │               │
│    /communications, /reports, /alerts,      ▼           │               │
│    /recommendations, /brief, /sim, /state   Service Layer               │
│                                             (src/lib/services/*)        │
│    Zod validation · role guards · rate limit    │                      │
│                                                 ├──► Event Bus (bus.ts) ┘
│                                                 │        publish()       │
│                                                 ├──► Audit (audit.ts)    │
│                                                 ├──► AI Providers (ai/*) │
│                                                 └──► Data Layer (db.ts)  │
│                                                          │              │
│                                                   JSON store (data/*)   │
└────────────────────────────────────────────────────────────────────────┘
```

**Layering & separation of concerns**
- **Controllers** — `src/app/api/**/route.ts`: parse/validate input (Zod), enforce authorization (`guard(capability)`), call a service, shape the response. No business logic.
- **Services** — `src/lib/services/*`: all domain logic (incident lifecycle, resource assignment with conflict prevention, task transitions, communication acknowledgement, alert/gap rules, report triage, agent orchestration, simulation). Each service publishes events and writes audit entries.
- **Data access** — `src/lib/db.ts`: a single typed store with debounced persistence.
- **Cross-cutting** — auth, audit, event bus, geo, AI provider selection.

## 2. AI Agent Architecture

An **AI provider abstraction** decouples the app from any single model:

```
AiProvider (interface)
├── DemoAiProvider   — deterministic rule/NLP engine (offline, no key)
└── OpenAiProvider   — OpenAI-compatible LLM  ──(on any error)──► DemoAiProvider
```

Interface methods: `classifyIncident`, `summarizeIncident`, `recommendResources`, `draftCommunication`, `assessEscalationRisk`, `detectRelatedIncidents`, `generateBrief`.

The **multi-agent orchestrator** (`services/agents.ts`) composes provider calls with deterministic rules over live state. Eight modular agents:

| # | Agent | Responsibility |
|---|-------|----------------|
| 1 | **Incident Intelligence** | Extract structured data, summarize, classify, flag missing info |
| 2 | **Coordination** | Identify required agencies, detect coordination gaps / missing acks |
| 3 | **Resource** | Inspect availability, recommend nearest units, flag shortages/conflicts |
| 4 | **Route & Logistics** | Inspect routes, flag blockages, recommend alternate access |
| 5 | **Communication** | Draft agency / command / public messages |
| 6 | **Risk & Escalation** | Monitor change, detect worsening conditions, recommend escalation |
| 7 | **Situation Briefing** | Generate command briefings, summarize state, list unresolved issues |
| 8 | **Audit & Explanation** | Record recommendation metadata; link actions to source events |

**Human-in-the-loop.** Agents never execute high-risk actions. Each produces an `AiRecommendation` (with a confidence score and an **auditable rationale summary** — never hidden chain-of-thought). A commander **Approves / Modifies / Rejects**; only on approval does the system execute (deploy resources, escalate severity, engage agencies, send messages), and the decision is written to the audit trail linked to the recommendation.

## 3. Data Flow (report → coordinated response)

```
Citizen/field report ─► POST /api/reports
     │  submitReport() → Incident Intelligence (classify) + duplicate detection
     ▼
Report (UNVERIFIED) with AI triage  ──human verify──►  createIncident() (VERIFIED)
     │
     ├─ Coordination Agent → required agencies + AGENCY_NOT_NOTIFIED gaps
     ├─ Resource Agent → nearest-unit recommendation (PENDING)
     │       └─ commander APPROVE → assignResource() (conflict-checked) → DEPLOYED
     ├─ Communication Agent → drafted message → sendCommunication() (SENT→DELIVERED→ACK)
     ├─ Route Agent → blocked-road detection → reroute recommendation
     └─ Risk & Escalation Agent → escalation recommendation → setSeverity/setStatus
     ▼
Situation Briefing Agent → command brief   |   Gap engine → coordination gaps
     ▼
Resolve → release resources, resolve gaps  →  Audit trail = full accountable history
```

Every mutation calls `publish(type, action)` on the event bus and `audit(...)`.

## 4. Real-Time Flow

- Clients open a single **SSE** connection to `/api/stream` (authenticated).
- The in-process **event bus** (`bus.ts`) keeps a set of subscribers; `publish()` fans an event to all of them.
- The client store debounces incoming events and refetches `/api/state` (a consolidated snapshot), so all screens — incidents, alerts, communications, resources, tasks, acknowledgements, gaps, and the simulation — update live without page reloads.
- Keep-alive pings every 20s; the client shows a Live/Reconnecting indicator and auto-reconnects.

Fallback: if the stream drops, the store still holds the last snapshot and reconnects; no functionality depends on manual refresh.

## 5. Database Structure

Relational model (typed in `src/lib/types.ts`). Key relationships:

```
agencies 1──* users
agencies 1──* resources
incidents 1──* incident_updates        (timeline)
incidents 1──* tasks
incidents 1──* communications
incidents 1──* ai_recommendations
incidents *──* agencies                 (incident.agencyIds)
incidents 1──* incident_reports         (report.linkedIncidentId)
resources *──1 incidents                (resource.assignedIncidentId)  ← assignment
coordination_gaps *──1 incidents
alerts *──1 incidents
audit_events *──1 incidents / *──1 ai_recommendations
zones / facilities / roads              (GIS reference data)
simulation_scenarios                    (demo)
```

Indexing/lookups are handled via typed accessors; operational datasets are small (hundreds of rows) so scans are appropriate. The accessor API mirrors a repository, enabling a drop-in SQL backend (SQLite/Postgres) without touching services.

## 6. Security Model

- **Authentication:** scrypt password hashing (per-user salt); stateless **HS256 JWT** in an `httpOnly`, `SameSite=Lax` cookie, 12h expiry (`jose`).
- **Authorization:** capability matrix (`auth.ts`) mapping capabilities → roles; enforced in every mutating route via `guard(capability)`. Middleware blocks unauthenticated navigation.
- **Input validation:** Zod schemas on all POST bodies; invalid input returns structured 400s.
- **Output safety:** React auto-escaping; no `dangerouslySetInnerHTML`.
- **Rate limiting:** in-memory limiter on authentication endpoints.
- **Auditability:** every significant action recorded with actor/role/entity/state-transition and any linked AI recommendation.
- **Secrets:** environment variables only; `.env.example` documents each; no secrets committed.

We do not claim external certification/compliance that has not been implemented.

## 7. Deployment Architecture

**Single-process (reference):**
```
[ Node process ] → Next.js server (UI + API) + in-process bus + JSON store + AI provider
```
`npm run build && npm start`, bind `0.0.0.0:3000`.

**Scale-out (path):**
```
[ N app instances ] ──► Redis Pub/Sub (event bus) ──► SSE fan-out
                   ──► Postgres (relational store)
                   ──► External LLM (OpenAI-compatible) with demo fallback
                   ──► Object storage for attachments
```
Both scale-out substitutions live behind existing interfaces (`bus.ts`, `db.ts`, `ai/*`), so the change is localized.

## 8. Scalability Notes
- **Modular services + agents:** new agents/rules plug into the orchestrator and gap engine without touching UI.
- **Provider abstraction:** new AI or map providers are additive.
- **Multi-region:** partition by city/region; shared coordination fabric via the bus abstraction.
- **New signals:** weather/traffic/IoT feeds enter through the same report/triage pipeline.
