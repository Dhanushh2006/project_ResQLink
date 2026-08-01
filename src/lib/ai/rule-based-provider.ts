// Rule-based incident intelligence engine.
//
// Deterministic text analysis: tokenizes reports, matches weighted
// keyword lexicons, scores severity, maps agencies/resources, and
// extracts missing information. Runs without external services and
// backs the LLM provider when it is unavailable.

import type {
  AgencyType,
  IncidentType,
  Priority,
  ResourceType,
  Severity,
} from '../types';
import type {
  AiProvider,
  BriefInput,
  ClassifyInput,
  ClassifyResult,
  CommDraftInput,
  EscalationInput,
  EscalationResult,
  RelatedInput,
  RelatedResult,
  ResourceRecInput,
  ResourceRecResult,
  SummaryInput,
} from './provider';

const norm = (s: string) => s.toLowerCase();
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

interface TypeRule {
  type: IncidentType;
  kw: string[];
  weight: number;
}

const TYPE_RULES: TypeRule[] = [
  { type: 'FIRE', kw: ['fire', 'smoke', 'burning', 'flames', 'blaze', 'arson', 'ignite'], weight: 1 },
  { type: 'FLOOD', kw: ['flood', 'water', 'inundat', 'overflow', 'submerg', 'drown', 'rising water'], weight: 1 },
  { type: 'COLLISION', kw: ['collision', 'crash', 'accident', 'vehicle', 'car', 'truck', 'pileup', 'overturn'], weight: 1 },
  { type: 'MEDICAL', kw: ['injured', 'injury', 'bleeding', 'unconscious', 'cardiac', 'casualt', 'wounded', 'trapped worker'], weight: 1 },
  { type: 'HAZMAT', kw: ['chemical', 'gas leak', 'toxic', 'hazmat', 'spill', 'fumes', 'ammonia', 'leak'], weight: 1 },
  { type: 'STRUCTURAL', kw: ['collapse', 'building', 'structure', 'crack', 'wall fell', 'debris'], weight: 1 },
  { type: 'CROWD', kw: ['crowd', 'stampede', 'stadium', 'panic', 'crush', 'rush'], weight: 1 },
  { type: 'ROAD_BLOCKAGE', kw: ['blocked', 'blockage', 'tree', 'road closed', 'traffic', 'obstruct', 'jam'], weight: 1 },
  { type: 'UTILITY', kw: ['power', 'electric', 'outage', 'transformer', 'water main', 'utility', 'blackout'], weight: 1 },
  { type: 'EARTHQUAKE', kw: ['earthquake', 'tremor', 'seismic', 'aftershock', 'quake'], weight: 1 },
  { type: 'MISSING_PERSON', kw: ['missing', 'lost child', 'cannot find', 'disappeared'], weight: 1 },
];

const SEVERITY_SIGNALS: { kw: string[]; score: number }[] = [
  { kw: ['trapped', 'multiple', 'spreading', 'explosion', 'collapse', 'critical', 'fatal', 'dead', 'many'], score: 3 },
  { kw: ['injured', 'fire', 'flood', 'gas', 'toxic', 'blocked', 'casualt', 'severe', 'heavy'], score: 2 },
  { kw: ['minor', 'small', 'reported', 'possible', 'suspected', 'smoke'], score: 1 },
];

const AGENCY_MAP: Record<IncidentType, AgencyType[]> = {
  FIRE: ['FIRE', 'EMS', 'POLICE', 'MUNICIPAL'],
  FLOOD: ['MUNICIPAL', 'RELIEF', 'EMS', 'POLICE'],
  COLLISION: ['EMS', 'POLICE', 'FIRE'],
  MEDICAL: ['EMS', 'POLICE'],
  HAZMAT: ['FIRE', 'EMS', 'MUNICIPAL', 'POLICE'],
  STRUCTURAL: ['FIRE', 'EMS', 'MUNICIPAL', 'POLICE'],
  CROWD: ['POLICE', 'EMS', 'MUNICIPAL'],
  ROAD_BLOCKAGE: ['MUNICIPAL', 'POLICE'],
  UTILITY: ['MUNICIPAL', 'FIRE'],
  EARTHQUAKE: ['FIRE', 'EMS', 'POLICE', 'MUNICIPAL', 'RELIEF'],
  MISSING_PERSON: ['POLICE', 'RELIEF'],
  OTHER: ['POLICE', 'MUNICIPAL'],
};

const RESOURCE_MAP: Record<IncidentType, ResourceType[]> = {
  FIRE: ['FIRE_ENGINE', 'AMBULANCE', 'POLICE_UNIT', 'RESCUE_TEAM'],
  FLOOD: ['RESCUE_TEAM', 'RELIEF_TEAM', 'AMBULANCE', 'SHELTER_CAPACITY'],
  COLLISION: ['AMBULANCE', 'POLICE_UNIT', 'FIRE_ENGINE'],
  MEDICAL: ['AMBULANCE', 'MEDICAL_SUPPLIES'],
  HAZMAT: ['FIRE_ENGINE', 'RESCUE_TEAM', 'AMBULANCE'],
  STRUCTURAL: ['RESCUE_TEAM', 'FIRE_ENGINE', 'AMBULANCE'],
  CROWD: ['POLICE_UNIT', 'AMBULANCE', 'MEDICAL_SUPPLIES'],
  ROAD_BLOCKAGE: ['EMERGENCY_VEHICLE', 'POLICE_UNIT'],
  UTILITY: ['GENERATOR', 'EMERGENCY_VEHICLE'],
  EARTHQUAKE: ['RESCUE_TEAM', 'AMBULANCE', 'RELIEF_TEAM', 'SHELTER_CAPACITY'],
  MISSING_PERSON: ['POLICE_UNIT', 'DRONE', 'VOLUNTEER_GROUP'],
  OTHER: ['POLICE_UNIT'],
};

const RISK_MAP: Record<IncidentType, string[]> = {
  FIRE: ['fire spread', 'smoke exposure', 'structural weakening', 'access disruption'],
  FLOOD: ['rising water level', 'stranded residents', 'contaminated water', 'infrastructure damage'],
  COLLISION: ['secondary collision', 'traffic gridlock', 'fuel leak', 'blocked emergency access'],
  MEDICAL: ['deterioration without care', 'delayed transport', 'crowd interference'],
  HAZMAT: ['toxic exposure', 'contamination spread', 'ignition risk', 'evacuation need'],
  STRUCTURAL: ['secondary collapse', 'trapped occupants', 'falling debris'],
  CROWD: ['crowd crush', 'stampede', 'blocked exits', 'panic escalation'],
  ROAD_BLOCKAGE: ['emergency access disruption', 'traffic buildup', 'delayed response'],
  UTILITY: ['prolonged outage', 'hospital power loss', 'communication disruption'],
  EARTHQUAKE: ['aftershocks', 'widespread collapse', 'utility failure', 'mass casualties'],
  MISSING_PERSON: ['exposure risk', 'time-critical search', 'expanding search radius'],
  OTHER: ['unknown escalation'],
};

function scoreType(text: string): { type: IncidentType; confidence: number } {
  const toks = new Set(tokens(text));
  const t = norm(text);
  let best: IncidentType = 'OTHER';
  let bestScore = 0;
  let total = 0;
  for (const rule of TYPE_RULES) {
    let s = 0;
    for (const kw of rule.kw) {
      if (kw.includes(' ') ? t.includes(kw) : toks.has(kw) || t.includes(kw)) {
        s += rule.weight;
      }
    }
    total += s;
    if (s > bestScore) {
      bestScore = s;
      best = rule.type;
    }
  }
  const confidence = bestScore === 0 ? 0.4 : Math.min(0.95, 0.55 + bestScore * 0.12);
  return { type: best, confidence };
}

function scoreSeverity(text: string, type: IncidentType): { severity: Severity; urgency: Priority } {
  const t = norm(text);
  let score = 0;
  for (const sig of SEVERITY_SIGNALS) {
    for (const kw of sig.kw) {
      if (t.includes(kw)) score += sig.score;
    }
  }
  // Type baseline
  if (['FIRE', 'HAZMAT', 'EARTHQUAKE', 'STRUCTURAL'].includes(type)) score += 2;
  if (['COLLISION', 'FLOOD', 'CROWD'].includes(type)) score += 1;

  let severity: Severity;
  if (score >= 6) severity = 'CRITICAL';
  else if (score >= 4) severity = 'HIGH';
  else if (score >= 2) severity = 'MODERATE';
  else severity = 'LOW';

  const urgency: Priority =
    severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : severity === 'MODERATE' ? 'NORMAL' : 'LOW';
  return { severity, urgency };
}

function detectMissingInfo(text: string, locationName?: string): string[] {
  const t = norm(text);
  const missing: string[] = [];
  if (!locationName && !/near|at|road|street|zone|junction|district|area|station/.test(t)) {
    missing.push('Precise location');
  }
  if (!/\b(\d+)\b/.test(t) && /(injur|trapped|casualt|people|worker|resident)/.test(t)) {
    missing.push('Number of people affected');
  }
  if (!/(fire|smoke|water|gas|collaps|injur|blocked|power)/.test(t)) {
    missing.push('Nature/severity of hazard');
  }
  if (!/(spread|contain|worse|improv|stable)/.test(t)) {
    missing.push('Current trend (spreading vs. contained)');
  }
  return missing.slice(0, 4);
}

function titleFrom(type: IncidentType, locationName?: string): string {
  const label: Record<IncidentType, string> = {
    FIRE: 'Fire Incident',
    FLOOD: 'Flooding',
    COLLISION: 'Vehicle Collision',
    MEDICAL: 'Medical Emergency',
    HAZMAT: 'Hazardous Material Incident',
    STRUCTURAL: 'Structural Collapse',
    CROWD: 'Crowd Safety Incident',
    ROAD_BLOCKAGE: 'Road Blockage',
    UTILITY: 'Utility Failure',
    EARTHQUAKE: 'Earthquake Response',
    MISSING_PERSON: 'Missing Person',
    OTHER: 'Emergency Incident',
  };
  return locationName ? `${label[type]} — ${locationName}` : label[type];
}

function jaccard(a: string, b: string): number {
  const sa = new Set(tokens(a).filter((w) => w.length > 3));
  const sb = new Set(tokens(b).filter((w) => w.length > 3));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter += 1;
  return inter / (sa.size + sb.size - inter);
}

export class RuleBasedProvider implements AiProvider {
  readonly name = 'ResQLink Rule Engine';
  readonly mode = 'local' as const;

  async classifyIncident(input: ClassifyInput): Promise<ClassifyResult> {
    const { type, confidence } = scoreType(input.text);
    const { severity, urgency } = scoreSeverity(input.text, type);
    const agencies = AGENCY_MAP[type];
    const requiredResources = RESOURCE_MAP[type];
    const risks = RISK_MAP[type];
    const missingInfo = detectMissingInfo(input.text, input.locationName);
    const suggestedAction = buildSuggestedAction(type, severity);
    return {
      category: type,
      severity,
      urgency,
      confidence,
      agencies,
      risks,
      suggestedAction,
      missingInfo,
      requiredResources,
      title: titleFrom(type, input.locationName),
    };
  }

  async summarizeIncident(input: SummaryInput): Promise<string> {
    const updates = input.updates.slice(-3);
    const trend = updates.length
      ? `Latest developments: ${updates.map((u) => `• ${u}`).join(' ')}`
      : 'No field updates recorded yet.';
    return `${input.title}. ${truncate(input.description, 220)} ${trend}`.trim();
  }

  async recommendResources(input: ResourceRecInput): Promise<ResourceRecResult> {
    const preferred = new Set(input.requiredResourceTypes);
    const scored = input.available
      .map((r) => {
        const typeScore = preferred.has(r.type) ? 3 : 0;
        const distScore = Math.max(0, 3 - r.distanceKm / 3);
        return { r, score: typeScore + distScore };
      })
      .sort((a, b) => b.score - a.score);

    const need = countNeeds(input.severity);
    const picks = scored
      .filter((s) => preferred.has(s.r.type))
      .slice(0, need)
      .map((s) => ({
        resourceId: s.r.id,
        label: s.r.label,
        reason: `${prettyType(s.r.type)} ~${s.r.distanceKm.toFixed(1)} km from incident`,
      }));

    return {
      picks,
      rationale: [
        `Incident severity: ${input.severity}`,
        `Required resource types: ${input.requiredResourceTypes.map(prettyType).join(', ')}`,
        `Selected nearest available units minimizing response distance`,
        `Recommended unit count for ${input.severity}: ${need}`,
      ],
      confidence: picks.length >= need ? 0.86 : 0.62,
    };
  }

  async draftCommunication(input: CommDraftInput): Promise<{ subject: string; body: string }> {
    const facts = input.keyFacts.map((f) => `- ${f}`).join('\n');
    if (input.audience === 'PUBLIC') {
      return {
        subject: `Public Safety Advisory — ${input.locationName}`,
        body: `A ${prettyIncident(input.incidentType)} is being managed near ${input.locationName}. Emergency services are on scene. Please avoid the area, follow official instructions, and keep access routes clear for responders.\n\nKey information:\n${facts}\n\nThis is an official ResQLink advisory. Updates will follow.`,
      };
    }
    if (input.audience === 'COMMANDER') {
      return {
        subject: `Command Broadcast — ${input.incidentTitle} [${input.severity}]`,
        body: `All coordinating agencies: a ${input.severity} ${prettyIncident(
          input.incidentType,
        )} is active at ${input.locationName}. Align to the unified operational picture in ResQLink.\n\nSituation:\n${facts}\n\nConfirm acknowledgement and report unit status.`,
      };
    }
    return {
      subject: `${prettyAgency(input.agency)} Coordination — ${input.incidentTitle} [${input.severity}]`,
      body: `${prettyAgency(
        input.agency,
      )}: your support is requested for a ${input.severity} ${prettyIncident(
        input.incidentType,
      )} at ${input.locationName}.\n\nDetails:\n${facts}\n\nPlease acknowledge and confirm unit availability via ResQLink.`,
    };
  }

  async assessEscalationRisk(input: EscalationInput): Promise<EscalationResult> {
    const reasons: string[] = [];
    let pressure = 0;
    if (input.severity === 'HIGH') pressure += 2;
    if (input.severity === 'CRITICAL') pressure += 3;
    if (input.ageMinutes > 30) {
      pressure += 1;
      reasons.push(`Incident active for ${Math.round(input.ageMinutes)} min without resolution`);
    }
    if (input.openGaps > 0) {
      pressure += input.openGaps;
      reasons.push(`${input.openGaps} unresolved coordination gap(s)`);
    }
    for (const s of input.worseningSignals) {
      pressure += 2;
      reasons.push(s);
    }
    const order: Severity[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    const idx = order.indexOf(input.severity);
    const toSeverity = order[Math.min(order.length - 1, idx + (pressure >= 3 ? 1 : 0))];
    const shouldEscalate = pressure >= 3 && toSeverity !== input.severity;
    if (shouldEscalate) reasons.unshift(`Escalation threshold reached (pressure score ${pressure})`);
    else if (reasons.length === 0) reasons.push('No worsening signals detected; maintain current posture');
    return {
      shouldEscalate,
      toSeverity,
      reasons,
      confidence: Math.min(0.9, 0.55 + pressure * 0.08),
    };
  }

  async detectRelatedIncidents(input: RelatedInput): Promise<RelatedResult> {
    const matches = input.existing
      .map((e) => {
        const textSim = jaccard(input.candidate.text, `${e.title} ${e.text}`);
        const locSim = input.candidate.locationName && e.locationName
          ? jaccard(input.candidate.locationName, e.locationName) * 0.6 +
            (norm(e.locationName) === norm(input.candidate.locationName) ? 0.4 : 0)
          : 0;
        const likelihood = Math.min(0.98, textSim * 0.7 + locSim * 0.5);
        const reasons: string[] = [];
        if (textSim > 0.15) reasons.push('overlapping description');
        if (locSim > 0.3) reasons.push('same/near location');
        return { id: e.id, likelihood, reason: reasons.join(', ') || 'weak signal' };
      })
      .filter((m) => m.likelihood >= 0.22)
      .sort((a, b) => b.likelihood - a.likelihood)
      .slice(0, 3);
    return { matches };
  }

  async generateBrief(input: BriefInput): Promise<string> {
    const lines: string[] = [];
    lines.push(`SITUATION OVERVIEW`);
    lines.push(
      `${input.activeIncidents.length} active incident(s); ${
        input.activeIncidents.filter((i) => i.severity === 'CRITICAL').length
      } critical. ${input.deployedResources} resources deployed, ${input.availableResources} available.`,
    );
    lines.push('');
    lines.push(`CRITICAL DEVELOPMENTS`);
    const crit = input.activeIncidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    if (crit.length) {
      for (const i of crit) lines.push(`• [${i.severity}] ${i.code} ${i.title} — ${i.status} @ ${i.locationName}`);
    } else lines.push('• No critical incidents at this time.');
    lines.push('');
    lines.push(`AGENCY READINESS`);
    for (const a of input.agencyReadiness) lines.push(`• ${a.name}: ${a.readiness}% ready`);
    lines.push('');
    lines.push(`UNRESOLVED COORDINATION GAPS`);
    if (input.openGaps.length) {
      for (const g of input.openGaps) lines.push(`• ${g.title} → ${g.suggestedAction}`);
    } else lines.push('• None — coordination nominal.');
    lines.push('');
    lines.push(`RECENT CHANGES`);
    if (input.recentChanges.length) for (const c of input.recentChanges.slice(0, 6)) lines.push(`• ${c}`);
    else lines.push('• No recent changes.');
    lines.push('');
    lines.push(`RECOMMENDED NEXT ACTIONS`);
    const actions = deriveNextActions(input);
    for (const a of actions) lines.push(`• ${a}`);
    return lines.join('\n');
  }
}

// ---------------- helpers ----------------

function buildSuggestedAction(type: IncidentType, severity: Severity): string {
  const base: Record<IncidentType, string> = {
    FIRE: 'Dispatch fire units, establish perimeter, stage EMS, identify evacuation route',
    FLOOD: 'Deploy rescue teams, open shelters, warn downstream residents',
    COLLISION: 'Dispatch EMS and traffic control, secure scene, clear lanes',
    MEDICAL: 'Dispatch nearest ambulance, prepare hospital destination',
    HAZMAT: 'Establish exclusion zone, dispatch hazmat-capable units, prepare evacuation',
    STRUCTURAL: 'Dispatch rescue team, assess secondary collapse risk, stage EMS',
    CROWD: 'Deploy crowd-control units, open additional exits, stage medical',
    ROAD_BLOCKAGE: 'Dispatch clearance team, reroute traffic, protect emergency access',
    UTILITY: 'Dispatch utility crew, deploy generators to critical sites',
    EARTHQUAKE: 'Activate multi-agency response, deploy rescue and relief, open shelters',
    MISSING_PERSON: 'Deploy search units and drone, define search radius, alert public',
    OTHER: 'Verify report and assign coordinating agency',
  };
  const prefix = severity === 'CRITICAL' ? 'URGENT: ' : '';
  return prefix + base[type];
}

function countNeeds(sev: Severity): number {
  return sev === 'CRITICAL' ? 3 : sev === 'HIGH' ? 2 : 1;
}

function deriveNextActions(input: BriefInput): string[] {
  const out: string[] = [];
  for (const g of input.openGaps.slice(0, 3)) out.push(g.suggestedAction);
  if (input.availableResources < 3) out.push('Review resource pool — availability running low');
  const lowReady = input.agencyReadiness.filter((a) => a.readiness < 60);
  for (const a of lowReady) out.push(`Follow up with ${a.name} on readiness (${a.readiness}%)`);
  if (out.length === 0) out.push('Maintain monitoring; no immediate command action required');
  return out.slice(0, 6);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function prettyType(t: ResourceType): string {
  return t.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function prettyIncident(t: IncidentType): string {
  return t.toLowerCase().replace(/_/g, ' ');
}
function prettyAgency(a?: AgencyType): string {
  if (!a) return 'Agency';
  const map: Record<AgencyType, string> = {
    POLICE: 'Police',
    FIRE: 'Fire & Rescue',
    EMS: 'EMS',
    MUNICIPAL: 'Municipal Authority',
    RELIEF: 'Relief Operations',
    COMMAND: 'Command',
  };
  return map[a];
}
