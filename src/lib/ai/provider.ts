// AiProvider is the interface the agent layer depends on. Two
// implementations exist: RuleBasedProvider (local, no key) and
// OpenAiProvider (OpenAI-compatible LLM). See index.ts for selection.

import type {
  AgencyType,
  IncidentType,
  Priority,
  ResourceType,
  Severity,
} from '../types';

export interface ClassifyInput {
  text: string;
  locationName?: string;
}

export interface ClassifyResult {
  category: IncidentType;
  severity: Severity;
  urgency: Priority;
  confidence: number; // 0-1
  agencies: AgencyType[];
  risks: string[];
  suggestedAction: string;
  missingInfo: string[];
  requiredResources: ResourceType[];
  title: string;
}

export interface SummaryInput {
  title: string;
  description: string;
  updates: string[];
}

export interface ResourceRecInput {
  incidentTitle: string;
  incidentType: IncidentType;
  severity: Severity;
  requiredResourceTypes: ResourceType[];
  available: { id: string; label: string; type: ResourceType; distanceKm: number }[];
}

export interface ResourceRecResult {
  picks: { resourceId: string; label: string; reason: string }[];
  rationale: string[];
  confidence: number;
}

export interface CommDraftInput {
  audience: 'AGENCY' | 'COMMANDER' | 'PUBLIC';
  incidentTitle: string;
  incidentType: IncidentType;
  severity: Severity;
  locationName: string;
  agency?: AgencyType;
  keyFacts: string[];
}

export interface EscalationInput {
  incidentTitle: string;
  severity: Severity;
  status: string;
  ageMinutes: number;
  openGaps: number;
  worseningSignals: string[];
}

export interface EscalationResult {
  shouldEscalate: boolean;
  toSeverity: Severity;
  reasons: string[];
  confidence: number;
}

export interface RelatedInput {
  candidate: { text: string; locationName: string };
  existing: { id: string; title: string; text: string; locationName: string }[];
}

export interface RelatedResult {
  matches: { id: string; likelihood: number; reason: string }[];
}

export interface BriefInput {
  activeIncidents: {
    code: string;
    title: string;
    severity: Severity;
    status: string;
    locationName: string;
  }[];
  criticalAlerts: string[];
  deployedResources: number;
  availableResources: number;
  openGaps: { title: string; suggestedAction: string }[];
  recentChanges: string[];
  agencyReadiness: { name: string; readiness: number }[];
}

export interface AiProvider {
  readonly name: string;
  readonly mode: 'local' | 'llm';
  classifyIncident(input: ClassifyInput): Promise<ClassifyResult>;
  summarizeIncident(input: SummaryInput): Promise<string>;
  recommendResources(input: ResourceRecInput): Promise<ResourceRecResult>;
  draftCommunication(input: CommDraftInput): Promise<{ subject: string; body: string }>;
  assessEscalationRisk(input: EscalationInput): Promise<EscalationResult>;
  detectRelatedIncidents(input: RelatedInput): Promise<RelatedResult>;
  generateBrief(input: BriefInput): Promise<string>;
}
