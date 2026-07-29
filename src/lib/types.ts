// Central type definitions for all core entities.

export type Role =
  | 'INCIDENT_COMMANDER'
  | 'POLICE_COORDINATOR'
  | 'FIRE_COORDINATOR'
  | 'EMS_COORDINATOR'
  | 'MUNICIPAL_AUTHORITY'
  | 'FIELD_RESPONDER'
  | 'RELIEF_COORDINATOR'
  | 'SYSTEM_ADMIN';

export const ROLES: Role[] = [
  'INCIDENT_COMMANDER',
  'POLICE_COORDINATOR',
  'FIRE_COORDINATOR',
  'EMS_COORDINATOR',
  'MUNICIPAL_AUTHORITY',
  'FIELD_RESPONDER',
  'RELIEF_COORDINATOR',
  'SYSTEM_ADMIN',
];

export type AgencyType =
  | 'POLICE'
  | 'FIRE'
  | 'EMS'
  | 'MUNICIPAL'
  | 'RELIEF'
  | 'COMMAND';

export type Severity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

export type IncidentStatus =
  | 'DETECTED'
  | 'VERIFICATION_REQUIRED'
  | 'VERIFIED'
  | 'ACTIVE'
  | 'ESCALATED'
  | 'STABILIZING'
  | 'RESOLVED'
  | 'ARCHIVED';

export const INCIDENT_STATUSES: IncidentStatus[] = [
  'DETECTED',
  'VERIFICATION_REQUIRED',
  'VERIFIED',
  'ACTIVE',
  'ESCALATED',
  'STABILIZING',
  'RESOLVED',
  'ARCHIVED',
];

export type IncidentType =
  | 'FIRE'
  | 'FLOOD'
  | 'COLLISION'
  | 'MEDICAL'
  | 'HAZMAT'
  | 'STRUCTURAL'
  | 'CROWD'
  | 'ROAD_BLOCKAGE'
  | 'UTILITY'
  | 'EARTHQUAKE'
  | 'MISSING_PERSON'
  | 'OTHER';

export type ResourceType =
  | 'AMBULANCE'
  | 'FIRE_ENGINE'
  | 'POLICE_UNIT'
  | 'RESCUE_TEAM'
  | 'MEDICAL_SUPPLIES'
  | 'RELIEF_TEAM'
  | 'SHELTER_CAPACITY'
  | 'GENERATOR'
  | 'DRONE'
  | 'EMERGENCY_VEHICLE'
  | 'VOLUNTEER_GROUP';

export type ResourceStatus =
  | 'AVAILABLE'
  | 'DEPLOYED'
  | 'BUSY'
  | 'OFFLINE'
  | 'MAINTENANCE';

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type CommType =
  | 'INCIDENT_UPDATE'
  | 'AGENCY_MESSAGE'
  | 'COMMANDER_BROADCAST'
  | 'CRITICAL_ALERT'
  | 'RESOURCE_REQUEST'
  | 'ESCALATION_ALERT'
  | 'PUBLIC_DRAFT';

export type AckState = 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED';

export type ReportStatus =
  | 'UNVERIFIED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'LINKED'
  | 'REJECTED';

export type ZoneType =
  | 'EVACUATION'
  | 'HAZARDOUS'
  | 'RESTRICTED'
  | 'RELIEF'
  | 'STAGING';

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type GapType =
  | 'AGENCY_NOT_NOTIFIED'
  | 'ACK_MISSING'
  | 'RESOURCE_UNAVAILABLE'
  | 'TASK_NOT_ACCEPTED'
  | 'OVERDUE_TASK'
  | 'CONFLICTING_UPDATE'
  | 'DUPLICATE_REPORT'
  | 'MISSING_INFO';

export interface LatLng {
  lat: number;
  lng: number;
}

// ---------------- Entities ----------------

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  agencyId: string | null;
  avatarColor: string;
  createdAt: string;
}

export interface Agency {
  id: string;
  name: string;
  type: AgencyType;
  contact: string;
  readiness: number; // 0-100
  color: string;
}

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  description: string;
  source: string;
  locationName: string;
  lat: number;
  lng: number;
  affectedPopulation: number;
  agencyIds: string[];
  requiredResourceTypes: ResourceType[];
  commanderId: string | null;
  escalated: boolean;
  detectedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  aiSummary?: string;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  authorId: string | null;
  authorName: string;
  kind: 'STATUS' | 'NOTE' | 'AI' | 'SYSTEM' | 'RESOURCE' | 'ESCALATION';
  message: string;
  fromStatus?: IncidentStatus;
  toStatus?: IncidentStatus;
  createdAt: string;
}

export interface IncidentReport {
  id: string;
  raw: string;
  reporter: string;
  channel: 'CITIZEN' | 'FIELD' | 'RADIO' | 'SENSOR' | 'PHONE';
  status: ReportStatus;
  locationName: string;
  lat: number;
  lng: number;
  category: IncidentType | null;
  urgency: Priority | null;
  confidence: number | null;
  suggestedAgencies: AgencyType[];
  suggestedAction: string | null;
  duplicateLikelihood: number | null;
  linkedIncidentId: string | null;
  createdAt: string;
}

export interface Resource {
  id: string;
  label: string;
  type: ResourceType;
  agencyId: string;
  status: ResourceStatus;
  locationName: string;
  lat: number;
  lng: number;
  capacity: number;
  assignedIncidentId: string | null;
  updatedAt: string;
}

export interface Task {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  agencyId: string | null;
  resourceId: string | null;
  priority: Priority;
  locationName: string;
  status: TaskStatus;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  type: CommType;
  priority: Priority;
  senderId: string | null;
  senderName: string;
  targetAgencyId: string | null;
  incidentId: string | null;
  subject: string;
  body: string;
  ackState: AckState;
  ackAt: string | null;
  createdAt: string;
}

export interface Alert {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  incidentId: string | null;
  status: AlertStatus;
  rule: string;
  createdAt: string;
}

export interface CoordinationGap {
  id: string;
  type: GapType;
  title: string;
  detail: string;
  incidentId: string | null;
  severity: Severity;
  suggestedAction: string;
  elapsedRef: string | null; // ISO timestamp gap started
  resolved: boolean;
  createdAt: string;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  note: string;
}

export interface Facility {
  id: string;
  name: string;
  kind: 'HOSPITAL' | 'SHELTER' | 'RELIEF_CENTER' | 'STAGING';
  lat: number;
  lng: number;
  capacity: number;
  note: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  status: 'OPEN' | 'BLOCKED' | 'CONGESTED';
  points: LatLng[];
  note: string;
}

export interface AiRecommendation {
  id: string;
  incidentId: string | null;
  agent: string;
  kind:
    | 'RESOURCE'
    | 'ESCALATION'
    | 'COMMUNICATION'
    | 'COORDINATION'
    | 'CLASSIFICATION'
    | 'BRIEF';
  title: string;
  body: string;
  rationale: string[];
  confidence: number;
  status: 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED';
  decidedById: string | null;
  decidedAt: string | null;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  userId: string | null;
  userName: string;
  role: Role | 'SYSTEM';
  action: string;
  entityType: string;
  entityId: string | null;
  incidentId: string | null;
  fromState: string | null;
  toState: string | null;
  aiRecommendationId: string | null;
  detail: string;
  createdAt: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  summary: string;
  primary: boolean;
}

export interface DbShape {
  users: User[];
  agencies: Agency[];
  incidents: Incident[];
  incidentUpdates: IncidentUpdate[];
  incidentReports: IncidentReport[];
  resources: Resource[];
  tasks: Task[];
  communications: Communication[];
  alerts: Alert[];
  coordinationGaps: CoordinationGap[];
  zones: Zone[];
  facilities: Facility[];
  roads: RoadSegment[];
  aiRecommendations: AiRecommendation[];
  auditEvents: AuditEvent[];
  scenarios: SimulationScenario[];
  meta: { seededAt: string; version: string };
}
