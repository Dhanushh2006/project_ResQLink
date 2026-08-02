// Handles inbound reports, AI triage, related-report detection.

import { db, persist, uid, now } from '../db';
import { publish } from '../bus';
import { audit } from '../audit';
import { getProvider } from '../ai';
import type { IncidentReport, ReportStatus } from '../types';
import type { Actor } from './incidents';

export function listReports(): IncidentReport[] {
  return [...db().incidentReports].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export function getReport(id: string): IncidentReport | undefined {
  return db().incidentReports.find((r) => r.id === id);
}

export interface SubmitReportInput {
  raw: string;
  reporter: string;
  channel: IncidentReport['channel'];
  locationName: string;
  lat: number;
  lng: number;
}

/** Submit a report and immediately run AI triage on it. */
export async function submitReport(input: SubmitReportInput, actor: Actor): Promise<IncidentReport> {
  const provider = getProvider();
  const analysis = await provider.classifyIncident({
    text: input.raw,
    locationName: input.locationName,
  });

  // related / duplicate detection against open incidents
  const existing = db()
    .incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status))
    .map((i) => ({
      id: i.id,
      title: i.title,
      text: i.description,
      locationName: i.locationName,
    }));
  const related = await provider.detectRelatedIncidents({
    candidate: { text: input.raw, locationName: input.locationName },
    existing,
  });
  const topMatch = related.matches[0];

  const report: IncidentReport = {
    id: uid('rpt'),
    raw: input.raw,
    reporter: input.reporter,
    channel: input.channel,
    status: 'UNVERIFIED',
    locationName: input.locationName,
    lat: input.lat,
    lng: input.lng,
    category: analysis.category,
    urgency: analysis.urgency,
    confidence: analysis.confidence,
    suggestedAgencies: analysis.agencies,
    suggestedAction: analysis.suggestedAction,
    duplicateLikelihood: topMatch ? topMatch.likelihood : 0,
    linkedIncidentId: null,
    createdAt: now(),
  };
  db().incidentReports.unshift(report);
  persist();
  publish('report', 'created', { id: report.id, data: report });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'REPORT_SUBMIT',
    entityType: 'report',
    entityId: report.id,
    detail: `${input.channel} report triaged as ${analysis.category} [${analysis.urgency}]`,
  });
  return report;
}

export function setReportStatus(id: string, status: ReportStatus, actor: Actor): IncidentReport {
  const r = getReport(id);
  if (!r) throw new Error('Report not found');
  const from = r.status;
  r.status = status;
  persist();
  publish('report', 'updated', { id: r.id, data: r });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'REPORT_STATUS',
    entityType: 'report',
    entityId: r.id,
    fromState: from,
    toState: status,
    detail: r.locationName,
  });
  return r;
}

export function linkReport(id: string, incidentId: string, actor: Actor): IncidentReport {
  const r = getReport(id);
  if (!r) throw new Error('Report not found');
  r.linkedIncidentId = incidentId;
  r.status = 'LINKED';
  persist();
  publish('report', 'updated', { id: r.id, data: r });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'REPORT_LINK',
    entityType: 'report',
    entityId: r.id,
    incidentId,
    toState: 'LINKED',
    detail: `${r.id} → ${incidentId}`,
  });
  return r;
}
