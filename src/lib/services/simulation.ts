// Scenario runner. Steps a scripted incident (Industrial Fire +
// Traffic Disruption) through the real service layer so the whole
// operational picture updates live over the SSE bus. Used to seed a
// realistic state and to walk through the response lifecycle.

import { db, persist, now } from '../db';
import { publish } from '../bus';
import { DEMO_CENTER } from '../seed-data';
import type { Actor } from './incidents';
import {
  createIncident,
  setStatus,
  setSeverity,
  addUpdate,
  getIncident,
  updateIncidentFields,
} from './incidents';
import { submitReport, setReportStatus, linkReport } from './reports';
import { assignResource, nearestAvailable } from './resources';
import { sendCommunication, acknowledge } from './communications';
import { createTask, setTaskStatus } from './tasks';
import { raiseAlert } from './alerts';
import {
  runIntelligenceAgent,
  runCoordinationAgent,
  runResourceAgent,
  runRouteAgent,
  runCommunicationAgent,
  runEscalationAgent,
} from './agents';
import { decideRecommendation } from './recommendations';

const CMD: Actor = { id: 'U-CMD', name: 'Cmdr. Alex Rivera', role: 'INCIDENT_COMMANDER' };

export interface SimStep {
  index: number;
  title: string;
  detail: string;
}

export const DEMO_STEPS: SimStep[] = [
  { index: 1, title: 'Citizen report arrives', detail: 'Heavy smoke reported near the Central Industrial Zone.' },
  { index: 2, title: 'AI classifies the report', detail: 'Incident Intelligence Agent triages category, severity, agencies.' },
  { index: 3, title: 'Duplicate detection', detail: 'A second related report is checked against the first.' },
  { index: 4, title: 'Commander verifies incident', detail: 'Report promoted to a verified incident.' },
  { index: 5, title: 'Required agencies identified', detail: 'Coordination Agent maps Fire, EMS, Police, Municipal.' },
  { index: 6, title: 'Incident appears on map', detail: 'Incident is now ACTIVE on the operational map.' },
  { index: 7, title: 'Resources recommended', detail: 'Resource Agent proposes nearest available units.' },
  { index: 8, title: 'Commander approves deployment', detail: 'Human-in-the-loop approval deploys units.' },
  { index: 9, title: 'Communication drafted', detail: 'Communication Agent drafts an agency coordination message.' },
  { index: 10, title: 'Agencies notified', detail: 'Critical coordination messages are sent.' },
  { index: 11, title: 'Agencies acknowledge', detail: 'Fire and EMS acknowledge; Police ack pending (gap will surface).' },
  { index: 12, title: 'New field report arrives', detail: 'Responder reports a blocked access road.' },
  { index: 13, title: 'Road blockage detected', detail: 'Route & Logistics Agent flags the obstruction.' },
  { index: 14, title: 'Route recommendation changes', detail: 'Alternate corridor recommended.' },
  { index: 15, title: 'Severity increases', detail: 'Fire spreads toward an adjacent warehouse.' },
  { index: 16, title: 'Escalation recommended', detail: 'Risk & Escalation Agent recommends escalation.' },
  { index: 17, title: 'Commander approves escalation', detail: 'Incident escalated; command notified.' },
  { index: 18, title: 'Situation Room updates', detail: 'All panels reflect the new operational picture.' },
  { index: 19, title: 'AI generates command briefing', detail: 'Situation Briefing Agent produces a brief.' },
  { index: 20, title: 'Incident stabilizes', detail: 'Fire contained; status set to STABILIZING.' },
  { index: 21, title: 'Incident resolves', detail: 'Incident marked RESOLVED and resources released.' },
  { index: 22, title: 'Audit timeline complete', detail: 'The full event is auditable end-to-end.' },
];

interface SimState {
  running: boolean;
  scenarioId: string;
  step: number;
  incidentId: string | null;
  reportIds: string[];
  createdAt: string;
}

const g = globalThis as unknown as { __resqlink_sim?: SimState };

function state(): SimState {
  if (!g.__resqlink_sim) {
    g.__resqlink_sim = {
      running: false,
      scenarioId: 'SC-FIRE',
      step: 0,
      incidentId: null,
      reportIds: [],
      createdAt: now(),
    };
  }
  return g.__resqlink_sim;
}

export function getSimState() {
  const s = state();
  return {
    running: s.running,
    scenarioId: s.scenarioId,
    step: s.step,
    totalSteps: DEMO_STEPS.length,
    incidentId: s.incidentId,
    steps: DEMO_STEPS,
    currentStep: s.step > 0 ? DEMO_STEPS[s.step - 1] : null,
  };
}

export function startSimulation(scenarioId = 'SC-FIRE') {
  const s = state();
  s.running = true;
  s.scenarioId = scenarioId;
  s.step = 0;
  s.incidentId = null;
  s.reportIds = [];
  s.createdAt = now();
  publish('sim', 'started', { data: getSimState() });
  return getSimState();
}

export function resetSimulation() {
  const s = state();
  s.running = false;
  s.step = 0;
  s.incidentId = null;
  s.reportIds = [];
  publish('sim', 'reset', { data: getSimState() });
  return getSimState();
}

const near = (d = 0.006) => ({
  lat: +(DEMO_CENTER.lat + 0.008 + (Math.random() - 0.5) * d).toFixed(5),
  lng: +(DEMO_CENTER.lng + 0.006 + (Math.random() - 0.5) * d).toFixed(5),
});

/** Advance the demo one step. Each step performs REAL mutations. */
export async function stepSimulation() {
  const s = state();
  if (s.step >= DEMO_STEPS.length) {
    s.running = false;
    publish('sim', 'completed', { data: getSimState() });
    return getSimState();
  }
  s.step += 1;
  const step = s.step;

  switch (step) {
    case 1: {
      const loc = near();
      const rpt = await submitReport(
        {
          raw: 'Heavy smoke reported near industrial area. Fire spreading toward nearby warehouse. Multiple workers may be trapped.',
          reporter: 'Citizen (demo)',
          channel: 'CITIZEN',
          locationName: 'Central Industrial Zone',
          lat: loc.lat,
          lng: loc.lng,
        },
        CMD,
      );
      s.reportIds.push(rpt.id);
      break;
    }
    case 2: {
      // triage already ran on submit; mark under review
      if (s.reportIds[0]) setReportStatus(s.reportIds[0], 'UNDER_REVIEW', CMD);
      break;
    }
    case 3: {
      const loc = near();
      const rpt2 = await submitReport(
        {
          raw: 'Fire alarm triggered close to the industrial zone, smoke visible from the road.',
          reporter: 'Field patrol (demo)',
          channel: 'FIELD',
          locationName: 'Central Industrial Zone',
          lat: loc.lat,
          lng: loc.lng,
        },
        CMD,
      );
      s.reportIds.push(rpt2.id);
      break;
    }
    case 4: {
      const loc = near(0.002);
      const inc = createIncident(
        {
          title: 'Industrial Fire — Central Industrial Zone',
          type: 'FIRE',
          severity: 'HIGH',
          description:
            'Heavy smoke and active fire spreading toward an adjacent warehouse. Multiple workers may be trapped. Confirmed via citizen and field reports.',
          source: 'Citizen + Field reports',
          locationName: 'Central Industrial Zone',
          lat: loc.lat,
          lng: loc.lng,
          affectedPopulation: 40,
          agencyIds: ['AG-FIRE', 'AG-EMS'],
          requiredResourceTypes: ['FIRE_ENGINE', 'AMBULANCE', 'RESCUE_TEAM', 'POLICE_UNIT'],
          commanderId: 'U-CMD',
          status: 'VERIFIED',
        },
        CMD,
      );
      s.incidentId = inc.id;
      for (const rid of s.reportIds) linkReport(rid, inc.id, CMD);
      await runIntelligenceAgent(inc.id);
      break;
    }
    case 5: {
      if (s.incidentId) {
        const rec = await runCoordinationAgent(s.incidentId);
        // engage the agencies the coordination agent surfaced
        const payload = rec.payload as { addAgencyIds?: string[] } | undefined;
        if (payload?.addAgencyIds?.length) {
          const inc = getIncident(s.incidentId)!;
          updateIncidentFields(
            s.incidentId,
            { agencyIds: Array.from(new Set([...inc.agencyIds, ...payload.addAgencyIds])) },
            CMD,
          );
        }
        decideRecommendation(rec.id, 'APPROVED', CMD);
      }
      break;
    }
    case 6: {
      if (s.incidentId) setStatus(s.incidentId, 'ACTIVE', CMD, 'Incident activated on operational map');
      break;
    }
    case 7: {
      if (s.incidentId) await runResourceAgent(s.incidentId);
      break;
    }
    case 8: {
      if (s.incidentId) {
        const inc = getIncident(s.incidentId)!;
        const picks = nearestAvailable(inc.lat, inc.lng, inc.requiredResourceTypes).slice(0, 3);
        for (const p of picks) {
          try {
            assignResource(p.id, s.incidentId, CMD);
          } catch { /* skip conflicts */ }
        }
      }
      break;
    }
    case 9: {
      if (s.incidentId) await runCommunicationAgent(s.incidentId, 'AGENCY', 'FIRE');
      break;
    }
    case 10: {
      if (s.incidentId) {
        sendCommunication(
          { type: 'CRITICAL_ALERT', priority: 'CRITICAL', targetAgencyId: 'AG-FIRE', incidentId: s.incidentId, subject: 'Fire & Rescue — immediate response', body: 'Deploy to Central Industrial Zone. Workers possibly trapped. Confirm units.' },
          CMD,
        );
        sendCommunication(
          { type: 'RESOURCE_REQUEST', priority: 'HIGH', targetAgencyId: 'AG-EMS', incidentId: s.incidentId, subject: 'EMS support requested', body: 'Stage ambulances at Central Staging Ground. Prepare hospital destinations.' },
          CMD,
        );
        sendCommunication(
          { type: 'AGENCY_MESSAGE', priority: 'HIGH', targetAgencyId: 'AG-POL', incidentId: s.incidentId, subject: 'Perimeter + traffic control', body: 'Establish perimeter and manage traffic around the industrial zone.' },
          CMD,
        );
      }
      break;
    }
    case 11: {
      // Fire & EMS acknowledge; Police intentionally left pending → gap surfaces
      const incId = s.incidentId;
      const comms = db().communications.filter((c) => c.incidentId === incId);
      for (const c of comms) {
        if (c.targetAgencyId === 'AG-FIRE' || c.targetAgencyId === 'AG-EMS') {
          acknowledge(c.id, { id: c.targetAgencyId === 'AG-FIRE' ? 'U-FIRE' : 'U-EMS', name: c.targetAgencyId === 'AG-FIRE' ? 'Capt. Marco Silva' : 'Dr. Lena Osei', role: c.targetAgencyId === 'AG-FIRE' ? 'FIRE_COORDINATOR' : 'EMS_COORDINATOR' });
        }
      }
      // leave the police message unacknowledged so the gap engine flags it
      const pol = comms.find((c) => c.targetAgencyId === 'AG-POL');
      if (pol) {
        const { raiseGap } = await import('./alerts');
        raiseGap({
          type: 'ACK_MISSING',
          title: `Acknowledgement overdue: ${pol.subject}`,
          detail: `HIGH message to Metro Police is still ${pol.ackState}. No acknowledgement received.`,
          incidentId: incId,
          severity: 'HIGH',
          suggestedAction: 'Escalate to Police Coordinator',
          elapsedRef: pol.createdAt,
          dedupeKey: `ACK_MISSING:${pol.id}`,
        });
      }
      break;
    }
    case 12: {
      if (s.incidentId) {
        const inc = getIncident(s.incidentId)!;
        addUpdate(s.incidentId, {
          authorId: 'U-FLD',
          authorName: 'Resp. Jordan Kim',
          kind: 'NOTE',
          message: 'Field report: Industrial Access Road blocked by overturned truck. Fire units cannot pass.',
        });
        // block the road
        const road = db().roads.find((r) => r.id === 'RD-1');
        if (road) {
          road.status = 'BLOCKED';
          road.note = 'Blocked by overturned truck (demo)';
          persist();
          publish('sim', 'road_blocked', { id: road.id });
          raiseAlert({ title: `Route blocked: ${road.name}`, detail: road.note, severity: 'HIGH', incidentId: s.incidentId, rule: 'blocked_route' });
        }
      }
      break;
    }
    case 13: {
      if (s.incidentId) await runRouteAgent(s.incidentId);
      break;
    }
    case 14: {
      if (s.incidentId) {
        addUpdate(s.incidentId, {
          authorId: null,
          authorName: 'Route & Logistics Agent',
          kind: 'AI',
          message: 'Alternate corridor recommended: approach via North Junction Bypass (RD-2).',
        });
      }
      break;
    }
    case 15: {
      if (s.incidentId) {
        addUpdate(s.incidentId, {
          authorId: 'U-FIRE',
          authorName: 'Capt. Marco Silva',
          kind: 'NOTE',
          message: 'Fire spreading to adjacent warehouse; additional units required.',
        });
      }
      break;
    }
    case 16: {
      if (s.incidentId) await runEscalationAgent(s.incidentId);
      break;
    }
    case 17: {
      if (s.incidentId) {
        setSeverity(s.incidentId, 'CRITICAL', CMD, 'Fire spread confirmed');
        setStatus(s.incidentId, 'ESCALATED', CMD, 'Commander approved escalation to CRITICAL');
        sendCommunication(
          { type: 'ESCALATION_ALERT', priority: 'CRITICAL', targetAgencyId: null, incidentId: s.incidentId, subject: 'ESCALATION — Industrial Fire now CRITICAL', body: 'Incident escalated to CRITICAL. All agencies align resources and confirm status.' },
          CMD,
        );
      }
      break;
    }
    case 18: {
      publish('sim', 'situation_room', { data: getSimState() });
      break;
    }
    case 19: {
      // briefing generated on demand by UI; just mark step
      if (s.incidentId) {
        addUpdate(s.incidentId, {
          authorId: null,
          authorName: 'Situation Briefing Agent',
          kind: 'AI',
          message: 'Command briefing generated and distributed.',
        });
      }
      break;
    }
    case 20: {
      if (s.incidentId) setStatus(s.incidentId, 'STABILIZING', CMD, 'Fire contained; overhaul in progress');
      break;
    }
    case 21: {
      if (s.incidentId) {
        setStatus(s.incidentId, 'RESOLVED', CMD, 'Fire extinguished; all workers accounted for');
        // release resources
        const { releaseResource } = await import('./resources');
        for (const r of db().resources.filter((x) => x.assignedIncidentId === s.incidentId)) {
          releaseResource(r.id, CMD);
        }
        // resolve gaps
        const { resolveGap, listGaps } = await import('./alerts');
        for (const gp of listGaps().filter((x) => x.incidentId === s.incidentId)) resolveGap(gp.id, CMD);
        // reopen road
        const road = db().roads.find((rr) => rr.id === 'RD-1');
        if (road) { road.status = 'OPEN'; road.note = 'Cleared'; persist(); }
      }
      break;
    }
    case 22: {
      s.running = false;
      publish('sim', 'completed', { data: getSimState() });
      break;
    }
  }

  publish('sim', 'stepped', { data: getSimState() });
  return getSimState();
}
