// A single source of truth for status/severity/priority visual
// treatment: icon + label + color (never color alone).
import {
  AlertTriangle, Flame, Ambulance, Shield, Building2, Radio, Waves, Car,
  HeartPulse, Biohazard, Building, Users, Construction, Zap, Activity,
  Search, HelpCircle, CircleDot, CheckCircle2, Circle, Clock, Ban,
  Loader2, XCircle, Truck, Plane, Package, Home, Warehouse, Cpu,
  ShieldAlert, PauseCircle, Archive, CircleCheck, TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  /** text color */
  fg: string;
  /** subtle bg + border for chips */
  chip: string;
  dot: string;
}

const SEV: Record<string, StatusMeta> = {
  CRITICAL: { label: 'Critical', icon: TriangleAlert, fg: 'text-sev-critical', chip: 'bg-sev-critical/10 text-sev-critical ring-1 ring-inset ring-sev-critical/30', dot: 'bg-sev-critical' },
  HIGH: { label: 'High', icon: AlertTriangle, fg: 'text-sev-high', chip: 'bg-sev-high/10 text-sev-high ring-1 ring-inset ring-sev-high/30', dot: 'bg-sev-high' },
  MODERATE: { label: 'Moderate', icon: CircleDot, fg: 'text-sev-moderate', chip: 'bg-sev-moderate/10 text-sev-moderate ring-1 ring-inset ring-sev-moderate/30', dot: 'bg-sev-moderate' },
  LOW: { label: 'Low', icon: Circle, fg: 'text-sev-low', chip: 'bg-sev-low/10 text-sev-low ring-1 ring-inset ring-sev-low/30', dot: 'bg-sev-low' },
};

const STATUS: Record<string, StatusMeta> = {
  // incident
  DETECTED: { label: 'Detected', icon: Search, fg: 'text-ink-muted', chip: 'bg-ink-faint/10 text-ink-muted ring-1 ring-inset ring-line', dot: 'bg-ink-faint' },
  VERIFICATION_REQUIRED: { label: 'Verify', icon: HelpCircle, fg: 'text-sev-moderate', chip: 'bg-sev-moderate/10 text-sev-moderate ring-1 ring-inset ring-sev-moderate/30', dot: 'bg-sev-moderate' },
  VERIFIED: { label: 'Verified', icon: CheckCircle2, fg: 'text-brand-300', chip: 'bg-brand-400/10 text-brand-300 ring-1 ring-inset ring-brand-400/30', dot: 'bg-brand-400' },
  ACTIVE: { label: 'Active', icon: Activity, fg: 'text-brand-300', chip: 'bg-brand-400/10 text-brand-300 ring-1 ring-inset ring-brand-400/30', dot: 'bg-brand-400' },
  ESCALATED: { label: 'Escalated', icon: ShieldAlert, fg: 'text-sev-critical', chip: 'bg-sev-critical/10 text-sev-critical ring-1 ring-inset ring-sev-critical/30', dot: 'bg-sev-critical' },
  STABILIZING: { label: 'Stabilizing', icon: Activity, fg: 'text-emerald-300', chip: 'bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30', dot: 'bg-emerald-400' },
  RESOLVED: { label: 'Resolved', icon: CircleCheck, fg: 'text-sev-low', chip: 'bg-sev-low/10 text-sev-low ring-1 ring-inset ring-sev-low/30', dot: 'bg-sev-low' },
  ARCHIVED: { label: 'Archived', icon: Archive, fg: 'text-ink-faint', chip: 'bg-ink-faint/10 text-ink-faint ring-1 ring-inset ring-line', dot: 'bg-ink-dim' },
  // resource
  AVAILABLE: { label: 'Available', icon: CheckCircle2, fg: 'text-sev-low', chip: 'bg-sev-low/10 text-sev-low ring-1 ring-inset ring-sev-low/30', dot: 'bg-sev-low' },
  DEPLOYED: { label: 'Deployed', icon: Truck, fg: 'text-brand-300', chip: 'bg-brand-400/10 text-brand-300 ring-1 ring-inset ring-brand-400/30', dot: 'bg-brand-400' },
  BUSY: { label: 'Busy', icon: Clock, fg: 'text-sev-high', chip: 'bg-sev-high/10 text-sev-high ring-1 ring-inset ring-sev-high/30', dot: 'bg-sev-high' },
  OFFLINE: { label: 'Offline', icon: Ban, fg: 'text-ink-faint', chip: 'bg-ink-faint/10 text-ink-faint ring-1 ring-inset ring-line', dot: 'bg-ink-dim' },
  MAINTENANCE: { label: 'Maintenance', icon: Construction, fg: 'text-purple-300', chip: 'bg-purple-400/10 text-purple-300 ring-1 ring-inset ring-purple-400/30', dot: 'bg-purple-400' },
  // task
  PENDING: { label: 'Pending', icon: Circle, fg: 'text-ink-muted', chip: 'bg-ink-faint/10 text-ink-muted ring-1 ring-inset ring-line', dot: 'bg-ink-faint' },
  ASSIGNED: { label: 'Assigned', icon: CircleDot, fg: 'text-brand-300', chip: 'bg-brand-400/10 text-brand-300 ring-1 ring-inset ring-brand-400/30', dot: 'bg-brand-400' },
  ACKNOWLEDGED: { label: 'Acknowledged', icon: CheckCircle2, fg: 'text-brand-300', chip: 'bg-brand-400/10 text-brand-300 ring-1 ring-inset ring-brand-400/30', dot: 'bg-brand-400' },
  IN_PROGRESS: { label: 'In progress', icon: Loader2, fg: 'text-sev-high', chip: 'bg-sev-high/10 text-sev-high ring-1 ring-inset ring-sev-high/30', dot: 'bg-sev-high' },
  BLOCKED: { label: 'Blocked', icon: Ban, fg: 'text-sev-critical', chip: 'bg-sev-critical/10 text-sev-critical ring-1 ring-inset ring-sev-critical/30', dot: 'bg-sev-critical' },
  COMPLETED: { label: 'Completed', icon: CircleCheck, fg: 'text-sev-low', chip: 'bg-sev-low/10 text-sev-low ring-1 ring-inset ring-sev-low/30', dot: 'bg-sev-low' },
  // ack
  SENT: { label: 'Sent', icon: Circle, fg: 'text-ink-muted', chip: 'bg-ink-faint/10 text-ink-muted ring-1 ring-inset ring-line', dot: 'bg-ink-faint' },
  DELIVERED: { label: 'Delivered', icon: CircleDot, fg: 'text-brand-300', chip: 'bg-brand-400/10 text-brand-300 ring-1 ring-inset ring-brand-400/30', dot: 'bg-brand-400' },
  // alert
  OPEN: { label: 'Open', icon: AlertTriangle, fg: 'text-sev-critical', chip: 'bg-sev-critical/10 text-sev-critical ring-1 ring-inset ring-sev-critical/30', dot: 'bg-sev-critical' },
};

const PRIORITY: Record<string, StatusMeta> = {
  CRITICAL: SEV.CRITICAL,
  HIGH: { label: 'High', icon: AlertTriangle, fg: 'text-sev-high', chip: 'bg-sev-high/10 text-sev-high ring-1 ring-inset ring-sev-high/30', dot: 'bg-sev-high' },
  NORMAL: { label: 'Normal', icon: CircleDot, fg: 'text-brand-300', chip: 'bg-brand-400/10 text-brand-300 ring-1 ring-inset ring-brand-400/30', dot: 'bg-brand-400' },
  LOW: { label: 'Low', icon: Circle, fg: 'text-ink-muted', chip: 'bg-ink-faint/10 text-ink-muted ring-1 ring-inset ring-line', dot: 'bg-ink-faint' },
};

export function sevMeta(s: string): StatusMeta {
  return SEV[s] || STATUS[s] || PRIORITY[s] || SEV.LOW;
}
export function statusMeta(s: string): StatusMeta {
  return STATUS[s] || SEV[s] || PRIORITY[s] || STATUS.PENDING;
}
export function priorityMeta(s: string): StatusMeta {
  return PRIORITY[s] || SEV[s] || PRIORITY.NORMAL;
}

export const INCIDENT_TYPE_ICON: Record<string, LucideIcon> = {
  FIRE: Flame, FLOOD: Waves, COLLISION: Car, MEDICAL: HeartPulse, HAZMAT: Biohazard,
  STRUCTURAL: Building, CROWD: Users, ROAD_BLOCKAGE: Construction, UTILITY: Zap,
  EARTHQUAKE: Activity, MISSING_PERSON: Search, OTHER: AlertTriangle,
};

export const AGENCY_TYPE_ICON: Record<string, LucideIcon> = {
  POLICE: Shield, FIRE: Flame, EMS: Ambulance, MUNICIPAL: Building2, RELIEF: HeartPulse, COMMAND: Radio,
};

export const RESOURCE_TYPE_ICON: Record<string, LucideIcon> = {
  AMBULANCE: Ambulance, FIRE_ENGINE: Flame, POLICE_UNIT: Shield, RESCUE_TEAM: Users,
  MEDICAL_SUPPLIES: Package, RELIEF_TEAM: HeartPulse, SHELTER_CAPACITY: Home,
  GENERATOR: Zap, DRONE: Plane, EMERGENCY_VEHICLE: Truck, VOLUNTEER_GROUP: Users,
};

export function incidentTypeIcon(t: string): LucideIcon { return INCIDENT_TYPE_ICON[t] || AlertTriangle; }
export function agencyTypeIcon(t: string): LucideIcon { return AGENCY_TYPE_ICON[t] || Building2; }
export function resourceTypeIcon(t: string): LucideIcon { return RESOURCE_TYPE_ICON[t] || Package; }
