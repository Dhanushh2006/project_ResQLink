// End-to-end workflow test over the service layer (no HTTP):
// REPORT → TRIAGE → VERIFY → CREATE INCIDENT → COORDINATE AGENCIES →
// ASSIGN RESOURCES → COMMUNICATE → ESCALATE → RESOLVE → AUDIT
import { describe, it, expect, beforeEach } from 'vitest';
import { replaceAll, db, resetInMemory } from '../src/lib/db';
import { buildSeed } from '../src/lib/seed-data';
import { submitReport } from '../src/lib/services/reports';
import {
  createIncident,
  setStatus,
  setSeverity,
} from '../src/lib/services/incidents';
import { assignResource, availableResources } from '../src/lib/services/resources';
import { sendCommunication, acknowledge } from '../src/lib/services/communications';
import { createTask, setTaskStatus } from '../src/lib/services/tasks';
import { runResourceAgent, runEscalationAgent } from '../src/lib/services/agents';
import { decideRecommendation } from '../src/lib/services/recommendations';
import { scanCoordinationGaps } from '../src/lib/services/gap-engine';

const CMD = { id: 'U-CMD', name: 'Cmdr. Alex Rivera', role: 'INCIDENT_COMMANDER' as const };

beforeEach(() => {
  process.env.RESQLINK_DB_PATH = '/tmp/resqlink-test-' + Math.random().toString(36).slice(2) + '.json';
  resetInMemory();
  replaceAll(buildSeed());
});

describe('Primary emergency workflow', () => {
  it('runs REPORT → TRIAGE → VERIFY → COORDINATE → ASSIGN → COMMUNICATE → ESCALATE → RESOLVE → AUDIT', async () => {
    // REPORT + TRIAGE
    const report = await submitReport(
      {
        raw: 'Heavy smoke reported near industrial area. Fire spreading toward warehouse. Workers trapped.',
        reporter: 'Citizen',
        channel: 'CITIZEN',
        locationName: 'Central Industrial Zone',
        lat: 12.98,
        lng: 77.6,
      },
      CMD,
    );
    expect(report.category).toBe('FIRE');
    expect(report.urgency).toBe('CRITICAL');

    // VERIFY → CREATE INCIDENT
    const inc = createIncident(
      {
        title: 'Industrial Fire',
        type: 'FIRE',
        severity: 'HIGH',
        description: report.raw,
        source: 'Citizen report',
        locationName: 'Central Industrial Zone',
        lat: 12.98,
        lng: 77.6,
        requiredResourceTypes: ['FIRE_ENGINE', 'AMBULANCE'],
        agencyIds: ['AG-FIRE', 'AG-EMS'],
        status: 'VERIFIED',
      },
      CMD,
    );
    expect(inc.status).toBe('VERIFIED');
    setStatus(inc.id, 'ACTIVE', CMD);

    // ASSIGN RESOURCES via agent recommendation (human approval)
    const rec = await runResourceAgent(inc.id);
    expect(rec.status).toBe('PENDING');
    decideRecommendation(rec.id, 'APPROVED', CMD);
    const picks = (rec.payload as any).picks as { resourceId: string }[];
    expect(picks.length).toBeGreaterThan(0);
    const r = assignResource(picks[0].resourceId, inc.id, CMD);
    expect(r.status).toBe('DEPLOYED');
    expect(r.assignedIncidentId).toBe(inc.id);

    // COMMUNICATE
    const comm = sendCommunication(
      { type: 'CRITICAL_ALERT', priority: 'CRITICAL', targetAgencyId: 'AG-FIRE', incidentId: inc.id, subject: 'Respond now', body: '...' },
      CMD,
    );
    expect(comm.ackState).toBe('SENT');
    acknowledge(comm.id, CMD);
    expect(db().communications.find((c) => c.id === comm.id)!.ackState).toBe('ACKNOWLEDGED');

    // ESCALATE
    const esc = await runEscalationAgent(inc.id);
    expect(esc.kind).toBe('ESCALATION');
    setSeverity(inc.id, 'CRITICAL', CMD);
    setStatus(inc.id, 'ESCALATED', CMD);

    // RESOLVE
    setStatus(inc.id, 'STABILIZING', CMD);
    const resolved = setStatus(inc.id, 'RESOLVED', CMD);
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedAt).toBeTruthy();

    // AUDIT
    const audits = db().auditEvents.filter((a) => a.incidentId === inc.id);
    const actions = audits.map((a) => a.action);
    expect(actions).toContain('INCIDENT_CREATE');
    expect(actions).toContain('RESOURCE_ASSIGN');
    expect(actions).toContain('AI_APPROVED');
    expect(actions.filter((a) => a === 'INCIDENT_STATUS').length).toBeGreaterThanOrEqual(3);
  });

  it('prevents resource assignment conflicts', () => {
    const a = availableResources()[0];
    const inc1 = createIncident({ title: 'A', type: 'FIRE', severity: 'HIGH', description: 'x', source: 's', locationName: 'L', lat: 12.9, lng: 77.6 }, CMD);
    const inc2 = createIncident({ title: 'B', type: 'FIRE', severity: 'HIGH', description: 'y', source: 's', locationName: 'L2', lat: 12.9, lng: 77.6 }, CMD);
    assignResource(a.id, inc1.id, CMD);
    expect(() => assignResource(a.id, inc2.id, CMD)).toThrow(/Conflict/);
  });

  it('detects an acknowledgement coordination gap', () => {
    const inc = createIncident({ title: 'A', type: 'FIRE', severity: 'CRITICAL', description: 'x', source: 's', locationName: 'L', lat: 12.9, lng: 77.6, status: 'ACTIVE' }, CMD);
    const comm = sendCommunication({ type: 'CRITICAL_ALERT', priority: 'CRITICAL', targetAgencyId: 'AG-POL', incidentId: inc.id, subject: 'Ack me', body: '...' }, CMD);
    // backdate the comm to exceed the SLA
    db().communications.find((c) => c.id === comm.id)!.createdAt = new Date(Date.now() - 5 * 60000).toISOString();
    const res = scanCoordinationGaps();
    expect(res.raised).toBeGreaterThan(0);
    const gaps = db().coordinationGaps.filter((g) => g.type === 'ACK_MISSING' && !g.resolved);
    expect(gaps.length).toBeGreaterThan(0);
  });

  it('rejects invalid incident status transitions', () => {
    const inc = createIncident({ title: 'A', type: 'FIRE', severity: 'LOW', description: 'x', source: 's', locationName: 'L', lat: 12.9, lng: 77.6, status: 'DETECTED' }, CMD);
    expect(() => setStatus(inc.id, 'RESOLVED', CMD)).toThrow(/Invalid transition/);
  });
});
