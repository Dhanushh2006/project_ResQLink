import { describe, it, expect, beforeEach } from 'vitest';
import { replaceAll, db, resetInMemory } from '../src/lib/db';
import { buildSeed } from '../src/lib/seed-data';
import { submitReport } from '../src/lib/services/reports';
import { createIncident } from '../src/lib/services/incidents';
import { createTask, setTaskStatus } from '../src/lib/services/tasks';
import { runResourceAgent, runCoordinationAgent, runRouteAgent, runBriefingAgent } from '../src/lib/services/agents';
import { scanCoordinationGaps } from '../src/lib/services/gap-engine';

const CMD = { id: 'U-CMD', name: 'Cmdr. Alex Rivera', role: 'INCIDENT_COMMANDER' as const };

beforeEach(() => {
  process.env.RESQLINK_DB_PATH = '/tmp/resqlink-svc-' + Math.random().toString(36).slice(2) + '.json';
  resetInMemory();
  replaceAll(buildSeed());
});

describe('Report triage + duplicate detection', () => {
  it('flags a likely duplicate against an existing incident', async () => {
    createIncident({
      title: 'Fire near railway', type: 'FIRE', severity: 'HIGH',
      description: 'Fire alarm triggered close to railway station, smoke visible',
      source: 's', locationName: 'Railway Station', lat: 12.98, lng: 77.6, status: 'ACTIVE',
    }, CMD);
    const r = await submitReport({
      raw: 'Smoke seen near railway station spreading', reporter: 'Citizen', channel: 'CITIZEN',
      locationName: 'Railway Station', lat: 12.98, lng: 77.6,
    }, CMD);
    expect(r.duplicateLikelihood).toBeGreaterThan(0.2);
    expect(r.category).toBe('FIRE');
  });
});

describe('Multi-agent orchestration', () => {
  it('resource agent recommends nearest units and creates a pending recommendation', async () => {
    const inc = createIncident({
      title: 'Fire', type: 'FIRE', severity: 'CRITICAL', description: 'x', source: 's',
      locationName: 'Zone', lat: 12.9756, lng: 77.6016, requiredResourceTypes: ['FIRE_ENGINE', 'AMBULANCE'], status: 'ACTIVE',
    }, CMD);
    const rec = await runResourceAgent(inc.id);
    expect(rec.status).toBe('PENDING');
    expect((rec.payload as any).picks.length).toBeGreaterThan(0);
  });

  it('coordination agent raises gaps for unengaged agencies', async () => {
    const inc = createIncident({
      title: 'Fire', type: 'FIRE', severity: 'HIGH', description: 'fire spreading', source: 's',
      locationName: 'Zone', lat: 12.9756, lng: 77.6016, agencyIds: [], status: 'ACTIVE',
    }, CMD);
    await runCoordinationAgent(inc.id);
    const gaps = db().coordinationGaps.filter((g) => g.type === 'AGENCY_NOT_NOTIFIED');
    expect(gaps.length).toBeGreaterThan(0);
  });

  it('route agent flags a blocked road near the incident', async () => {
    // block RD-1 which sits near the industrial zone
    const rd = db().roads.find((r) => r.id === 'RD-1')!;
    rd.status = 'BLOCKED';
    const inc = createIncident({
      title: 'Fire', type: 'FIRE', severity: 'HIGH', description: 'x', source: 's',
      locationName: 'Industrial', lat: rd.points[1].lat, lng: rd.points[1].lng, status: 'ACTIVE',
    }, CMD);
    const rec = await runRouteAgent(inc.id);
    expect((rec.payload as any).blocked).toContain('RD-1');
  });

  it('briefing agent produces a structured brief', async () => {
    createIncident({ title: 'Fire', type: 'FIRE', severity: 'CRITICAL', description: 'x', source: 's', locationName: 'Z', lat: 12.9, lng: 77.6, status: 'ACTIVE' }, CMD);
    const brief = await runBriefingAgent();
    expect(brief).toContain('SITUATION OVERVIEW');
    expect(brief).toContain('RECOMMENDED NEXT ACTIONS');
  });
});

describe('Gap engine: overdue task', () => {
  it('detects an overdue task', () => {
    const inc = createIncident({ title: 'A', type: 'FIRE', severity: 'HIGH', description: 'x', source: 's', locationName: 'L', lat: 12.9, lng: 77.6, status: 'ACTIVE' }, CMD);
    const t = createTask({ incidentId: inc.id, title: 'Clear road', description: '', agencyId: 'AG-MUN', priority: 'HIGH', locationName: 'L', deadline: new Date(Date.now() - 60000).toISOString() }, CMD);
    const res = scanCoordinationGaps();
    expect(res.raised).toBeGreaterThan(0);
    expect(db().coordinationGaps.some((g) => g.type === 'OVERDUE_TASK')).toBe(true);
  });
});
