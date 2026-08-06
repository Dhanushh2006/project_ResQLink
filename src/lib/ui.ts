// Shared UI helpers (client + server safe).
import type { Role, Severity } from './types';

export const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MODERATE: '#eab308',
  LOW: '#22c55e',
};

export const SEVERITY_BG: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-300 border border-red-500/40',
  HIGH: 'bg-orange-500/15 text-orange-300 border border-orange-500/40',
  MODERATE: 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/40',
  LOW: 'bg-green-500/15 text-green-300 border border-green-500/40',
};

export const STATUS_BG: Record<string, string> = {
  DETECTED: 'bg-slate-500/15 text-slate-300 border border-slate-500/40',
  VERIFICATION_REQUIRED: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
  VERIFIED: 'bg-sky-500/15 text-sky-300 border border-sky-500/40',
  ACTIVE: 'bg-blue-500/15 text-blue-300 border border-blue-500/40',
  ESCALATED: 'bg-red-500/15 text-red-300 border border-red-500/40',
  STABILIZING: 'bg-teal-500/15 text-teal-300 border border-teal-500/40',
  RESOLVED: 'bg-green-500/15 text-green-300 border border-green-500/40',
  ARCHIVED: 'bg-slate-600/15 text-slate-400 border border-slate-600/40',
  AVAILABLE: 'bg-green-500/15 text-green-300 border border-green-500/40',
  DEPLOYED: 'bg-blue-500/15 text-blue-300 border border-blue-500/40',
  BUSY: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
  OFFLINE: 'bg-slate-600/15 text-slate-400 border border-slate-600/40',
  MAINTENANCE: 'bg-purple-500/15 text-purple-300 border border-purple-500/40',
  PENDING: 'bg-slate-500/15 text-slate-300 border border-slate-500/40',
  ASSIGNED: 'bg-sky-500/15 text-sky-300 border border-sky-500/40',
  ACKNOWLEDGED: 'bg-blue-500/15 text-blue-300 border border-blue-500/40',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
  BLOCKED: 'bg-red-500/15 text-red-300 border border-red-500/40',
  COMPLETED: 'bg-green-500/15 text-green-300 border border-green-500/40',
  SENT: 'bg-slate-500/15 text-slate-300 border border-slate-500/40',
  DELIVERED: 'bg-sky-500/15 text-sky-300 border border-sky-500/40',
  OPEN: 'bg-red-500/15 text-red-300 border border-red-500/40',
};

export const PRIORITY_BG: Record<string, string> = {
  LOW: 'bg-slate-500/15 text-slate-300',
  NORMAL: 'bg-sky-500/15 text-sky-300',
  HIGH: 'bg-orange-500/15 text-orange-300',
  CRITICAL: 'bg-red-500/15 text-red-300',
};

export const ROLE_LABEL: Record<Role, string> = {
  INCIDENT_COMMANDER: 'Incident Commander',
  POLICE_COORDINATOR: 'Police Coordinator',
  FIRE_COORDINATOR: 'Fire & Rescue Coordinator',
  EMS_COORDINATOR: 'EMS Coordinator',
  MUNICIPAL_AUTHORITY: 'Municipal / Disaster Authority',
  FIELD_RESPONDER: 'Field Responder',
  RELIEF_COORDINATOR: 'Relief / Volunteer Coordinator',
  SYSTEM_ADMIN: 'System Administrator',
};

export function pretty(s: string): string {
  return s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function elapsed(iso: string): string {
  const s = Math.floor((Date.now() - +new Date(iso)) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
