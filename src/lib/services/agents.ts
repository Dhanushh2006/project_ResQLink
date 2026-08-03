// Eight modular agents cooperate over the shared operational state.
// Each agent has a single responsibility and produces auditable,
// human-approvable recommendations. Agents call the AiProvider
// (LLM or deterministic demo engine) plus deterministic rules over
// live state — never autonomous high-risk execution.

import { db, now } from '../db';
import { getProvider } from '../ai';
import { haversineKm } from '../geo';
import type {
  AgencyType,
  Incident,
  Resource,
} from '../types';
import {
  getIncident,
  getUpdates,
  listIncidents,
} from './incidents';
import { nearestAvailable } from './resources';
import { createRecommendation, listRecommendations } from './recommendations';
import { raiseGap, listGaps } from './alerts';

export const AGENTS = [
  { key: 'incident_intelligence', name: 'Incident Intelligence Agent', role: 'Extracts structured data, summarizes, classifies, flags missing info' },
  { key: 'coordination', name: 'Coordination Agent', role: 'Identifies required agencies, detects coordination gaps and missing acks' },
  { key: 'resource', name: 'Resource Agent', role: 'Inspects availability, recommends nearest units, flags shortages/conflicts' },
  { key: 'route_logistics', name: 'Route & Logistics Agent', role: 'Inspects routes, flags blockages, recommends alternate access' },
  { key: 'communication', name: 'Communication Agent', role: 'Drafts agency, command, and public messages' },
  { key: 'risk_escalation', name: 'Risk & Escalation Agent', role: 'Monitors change, detects worsening conditions, recommends escalation' },
  { key: 'situation_briefing', name: 'Situation Briefing Agent', role: 'Generates command briefings and summarizes current state' },
  { key: 'audit_explanation', name: 'Audit & Explanation Agent', role: 'Records recommendation metadata and links actions to source events' },
] as const;

const agencyTypeToId = (type: AgencyType): string | null =>
  db().agencies.find((a) => a.type === type)?.id ?? null;

// -------- Agent 3: Resource Agent --------
export async function runResourceAgent(incidentId: string) {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const available = nearestAvailable(inc.lat, inc.lng, inc.requiredResourceTypes).map((r) => ({
    id: r.id,
    label: r.label,
    type: r.type,
    distanceKm: r.distanceKm,
  }));
  const result = await getProvider().recommendResources({
    incidentTitle: inc.title,
    incidentType: inc.type,
    severity: inc.severity,
    requiredResourceTypes: inc.requiredResourceTypes,
    available,
  });
  const shortage = result.picks.length === 0 || available.length === 0;
  const rec = createRecommendation({
    incidentId,
    agent: 'Resource Agent',
    kind: 'RESOURCE',
    title: shortage
      ? 'Resource shortage detected'
      : `Deploy ${result.picks.length} unit(s)`,
    body: shortage
      ? 'No available units match the required resource types near this incident.'
      : result.picks.map((p) => `${p.label} — ${p.reason}`).join('\n'),
    rationale: result.rationale,
    confidence: result.confidence,
    payload: { picks: result.picks },
  });
  if (shortage) {
    raiseGap({
      type: 'RESOURCE_UNAVAILABLE',
      title: `Resource shortage for ${inc.id}`,
      detail: `Required: ${inc.requiredResourceTypes.join(', ') || 'unspecified'} — none available nearby.`,
      incidentId,
      severity: inc.severity,
      suggestedAction: 'Request mutual aid or reprioritize existing units',
    });
  }
  return rec;
}

// -------- Agent 6: Risk & Escalation Agent --------
export async function runEscalationAgent(incidentId: string) {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const ageMinutes = (Date.now() - +new Date(inc.detectedAt)) / 60000;
  const openGaps = listGaps().filter((g) => g.incidentId === incidentId).length;
  const worsening: string[] = [];
  const recentUpdates = getUpdates(incidentId).slice(0, 5);
  for (const u of recentUpdates) {
    if (/spread|worse|rising|more|additional|second|trapped|explos|collaps/i.test(u.message)) {
      worsening.push(`Field signal: "${truncate(u.message, 80)}"`);
    }
  }
  const result = await getProvider().assessEscalationRisk({
    incidentTitle: inc.title,
    severity: inc.severity,
    status: inc.status,
    ageMinutes,
    openGaps,
    worseningSignals: worsening.slice(0, 3),
  });
  return createRecommendation({
    incidentId,
    agent: 'Risk & Escalation Agent',
    kind: 'ESCALATION',
    title: result.shouldEscalate
      ? `Escalate severity to ${result.toSeverity}`
      : 'Maintain current posture',
    body: result.shouldEscalate
      ? `Recommend escalating ${inc.id} from ${inc.severity} to ${result.toSeverity} and notifying command.`
      : `No escalation recommended for ${inc.id} at this time.`,
    rationale: result.reasons,
    confidence: result.confidence,
    payload: { shouldEscalate: result.shouldEscalate, toSeverity: result.toSeverity },
  });
}

// -------- Agent 5: Communication Agent --------
export async function runCommunicationAgent(
  incidentId: string,
  audience: 'AGENCY' | 'COMMANDER' | 'PUBLIC',
  agency?: AgencyType,
) {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const keyFacts = [
    `Type: ${inc.type}`,
    `Severity: ${inc.severity}`,
    `Location: ${inc.locationName}`,
    `Status: ${inc.status}`,
    inc.affectedPopulation ? `Est. affected: ${inc.affectedPopulation}` : 'Affected population being assessed',
  ];
  const draft = await getProvider().draftCommunication({
    audience,
    incidentTitle: inc.title,
    incidentType: inc.type,
    severity: inc.severity,
    locationName: inc.locationName,
    agency,
    keyFacts,
  });
  return createRecommendation({
    incidentId,
    agent: 'Communication Agent',
    kind: 'COMMUNICATION',
    title: `Draft ${audience.toLowerCase()} message`,
    body: `${draft.subject}\n\n${draft.body}`,
    rationale: [
      `Audience: ${audience}`,
      agency ? `Target agency: ${agency}` : 'Broadcast to all coordinating agencies',
      `Derived from incident facts and current status`,
    ],
    confidence: 0.8,
    payload: { subject: draft.subject, body: draft.body, audience, agency: agency ?? null },
  });
}

// -------- Agent 2: Coordination Agent --------
export async function runCoordinationAgent(incidentId: string) {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const analysis = await getProvider().classifyIncident({
    text: `${inc.title}. ${inc.description}`,
    locationName: inc.locationName,
  });
  const requiredAgencyIds = analysis.agencies
    .map(agencyTypeToId)
    .filter((x): x is string => !!x);
  const missing = requiredAgencyIds.filter((id) => !inc.agencyIds.includes(id));
  const missingNames = missing
    .map((id) => db().agencies.find((a) => a.id === id)?.name)
    .filter(Boolean);

  for (const id of missing) {
    const name = db().agencies.find((a) => a.id === id)?.name || id;
    raiseGap({
      type: 'AGENCY_NOT_NOTIFIED',
      title: `${name} not yet engaged on ${inc.id}`,
      detail: `Incident classification indicates ${name} involvement, but it is not on the incident roster.`,
      incidentId,
      severity: inc.severity,
      suggestedAction: `Add ${name} to incident and send coordination message`,
    });
  }

  return createRecommendation({
    incidentId,
    agent: 'Coordination Agent',
    kind: 'COORDINATION',
    title: missing.length
      ? `Engage ${missing.length} additional agency(ies)`
      : 'Agency coordination complete',
    body: missing.length
      ? `Recommend engaging: ${missingNames.join(', ')}`
      : 'All required agencies are engaged on this incident.',
    rationale: [
      `Classified type: ${analysis.category}`,
      `Recommended agencies: ${analysis.agencies.join(', ')}`,
      missing.length ? `Not yet engaged: ${missingNames.join(', ')}` : 'Full roster present',
    ],
    confidence: analysis.confidence,
    payload: { addAgencyIds: missing },
  });
}

// -------- Agent 4: Route & Logistics Agent --------
export async function runRouteAgent(incidentId: string) {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const blocked = db().roads.filter((r) => r.status !== 'OPEN');
  const nearBlocked = blocked
    .map((r) => {
      const nearestPt = r.points
        .map((p) => haversineKm({ lat: inc.lat, lng: inc.lng }, p))
        .sort((a, b) => a - b)[0];
      return { road: r, distanceKm: nearestPt ?? Infinity };
    })
    .filter((x) => x.distanceKm < 3)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const affected = nearBlocked.length > 0;
  if (affected) {
    raiseGap({
      type: 'CONFLICTING_UPDATE',
      title: `Access route impacted near ${inc.id}`,
      detail: nearBlocked
        .map((x) => `${x.road.name} is ${x.road.status} (${x.distanceKm.toFixed(1)} km)`) 
        .join('; '),
      incidentId,
      severity: inc.severity,
      suggestedAction: 'Reroute responders via alternate corridor',
    });
  }

  return createRecommendation({
    incidentId,
    agent: 'Route & Logistics Agent',
    kind: 'COORDINATION',
    title: affected
      ? `${nearBlocked.length} route obstruction(s) near incident`
      : 'Primary access routes clear',
    body: affected
      ? nearBlocked
          .map((x) => `${x.road.name}: ${x.road.status} — ${x.road.note}`)
          .join('\n') + '\n\nRecommend approaching from the nearest open corridor.'
      : 'No blocked or congested road segments detected within 3 km.',
    rationale: [
      `Scanned ${db().roads.length} monitored road segments`,
      affected ? `Obstructions: ${nearBlocked.map((x) => x.road.name).join(', ')}` : 'All near routes open',
    ],
    confidence: 0.78,
    payload: { blocked: nearBlocked.map((x) => x.road.id) },
  });
}

// -------- Agent 7: Situation Briefing Agent --------
export async function runBriefingAgent(): Promise<string> {
  const active = listIncidents().filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status));
  const resources = db().resources;
  const gaps = listGaps();
  const alerts = db().alerts.filter((a) => a.status === 'OPEN');
  const recentChanges = db()
    .incidentUpdates.slice(0, 8)
    .map((u) => `${u.message}`);
  const brief = await getProvider().generateBrief({
    activeIncidents: active.map((i) => ({
      code: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      locationName: i.locationName,
    })),
    criticalAlerts: alerts.filter((a) => a.severity === 'CRITICAL').map((a) => a.title),
    deployedResources: resources.filter((r) => r.status === 'DEPLOYED').length,
    availableResources: resources.filter((r) => r.status === 'AVAILABLE').length,
    openGaps: gaps.map((g) => ({ title: g.title, suggestedAction: g.suggestedAction })),
    recentChanges,
    agencyReadiness: db().agencies.map((a) => ({ name: a.name, readiness: a.readiness })),
  });
  return brief;
}

// -------- Agent 1: Incident Intelligence Agent --------
export async function runIntelligenceAgent(incidentId: string) {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const analysis = await getProvider().classifyIncident({
    text: `${inc.title}. ${inc.description}`,
    locationName: inc.locationName,
  });
  if (analysis.missingInfo.length) {
    raiseGap({
      type: 'MISSING_INFO',
      title: `Missing information on ${inc.id}`,
      detail: `AI flagged missing: ${analysis.missingInfo.join(', ')}`,
      incidentId,
      severity: 'MODERATE',
      suggestedAction: 'Request field confirmation of missing details',
    });
  }
  return createRecommendation({
    incidentId,
    agent: 'Incident Intelligence Agent',
    kind: 'CLASSIFICATION',
    title: `Classified as ${analysis.category} [${analysis.severity}]`,
    body: `Risks: ${analysis.risks.join(', ')}\nSuggested action: ${analysis.suggestedAction}\nMissing info: ${analysis.missingInfo.join(', ') || 'none'}`,
    rationale: [
      `Confidence: ${(analysis.confidence * 100).toFixed(0)}%`,
      `Recommended agencies: ${analysis.agencies.join(', ')}`,
      `Required resources: ${analysis.requiredResources.join(', ')}`,
    ],
    confidence: analysis.confidence,
    payload: analysis as any,
  });
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
