// Base map is centered on a fictional metropolitan region. All
// people, agencies, and resources are fictional sample data.

import { hashPassword } from './auth';
import type { DbShape } from './types';

// Fictional city center (uses real coordinates near a generic
// urban area only so OpenStreetMap tiles render; no real orgs).
const CX = 12.9716;
const CY = 77.5946;

function jitter(base: number, d: number): number {
  return +(base + (Math.random() - 0.5) * d).toFixed(5);
}

export function buildSeed(): DbShape {
  const agencies = [
    { id: 'AG-CMD', name: 'ResQLink Command', type: 'COMMAND' as const, contact: 'command@resqlink.demo', readiness: 96, color: '#a3e635' },
    { id: 'AG-POL', name: 'Metro Police', type: 'POLICE' as const, contact: 'ops@metropolice.demo', readiness: 84, color: '#22c55e' },
    { id: 'AG-FIRE', name: 'City Fire & Rescue', type: 'FIRE' as const, contact: 'dispatch@cityfire.demo', readiness: 88, color: '#ef4444' },
    { id: 'AG-EMS', name: 'City EMS', type: 'EMS' as const, contact: 'control@cityems.demo', readiness: 79, color: '#22c55e' },
    { id: 'AG-MUN', name: 'Municipal Disaster Authority', type: 'MUNICIPAL' as const, contact: 'mda@city.demo', readiness: 72, color: '#eab308' },
    { id: 'AG-REL', name: 'Relief Operations Team', type: 'RELIEF' as const, contact: 'relief@aidteam.demo', readiness: 68, color: '#f97316' },
  ];

  const pw = hashPassword('resqlink');
  const users = [
    { id: 'U-CMD', name: 'Cmdr. Alex Rivera', email: 'commander@resqlink.demo', role: 'INCIDENT_COMMANDER' as const, agencyId: 'AG-CMD', color: '#a3e635' },
    { id: 'U-POL', name: 'Lt. Priya Nair', email: 'police@resqlink.demo', role: 'POLICE_COORDINATOR' as const, agencyId: 'AG-POL', color: '#22c55e' },
    { id: 'U-FIRE', name: 'Capt. Marco Silva', email: 'fire@resqlink.demo', role: 'FIRE_COORDINATOR' as const, agencyId: 'AG-FIRE', color: '#ef4444' },
    { id: 'U-EMS', name: 'Dr. Lena Osei', email: 'ems@resqlink.demo', role: 'EMS_COORDINATOR' as const, agencyId: 'AG-EMS', color: '#22c55e' },
    { id: 'U-MUN', name: 'Dir. Sam Whitfield', email: 'municipal@resqlink.demo', role: 'MUNICIPAL_AUTHORITY' as const, agencyId: 'AG-MUN', color: '#eab308' },
    { id: 'U-FLD', name: 'Resp. Jordan Kim', email: 'field@resqlink.demo', role: 'FIELD_RESPONDER' as const, agencyId: 'AG-FIRE', color: '#f97316' },
    { id: 'U-REL', name: 'Coord. Maya Patel', email: 'relief@resqlink.demo', role: 'RELIEF_COORDINATOR' as const, agencyId: 'AG-REL', color: '#f97316' },
    { id: 'U-ADM', name: 'Admin Chris Vance', email: 'admin@resqlink.demo', role: 'SYSTEM_ADMIN' as const, agencyId: 'AG-CMD', color: '#94a3b8' },
  ].map((u) => ({ ...u, passwordHash: pw, avatarColor: u.color, createdAt: new Date().toISOString() }));

  const facilities = [
    { id: 'FAC-H1', name: 'City General Hospital', kind: 'HOSPITAL' as const, lat: jitter(CX, 0.02), lng: jitter(CY, 0.02), capacity: 320, note: 'Level-1 trauma center' },
    { id: 'FAC-H2', name: 'Riverside Medical Center', kind: 'HOSPITAL' as const, lat: jitter(CX, 0.03), lng: jitter(CY, 0.03), capacity: 180, note: 'Emergency + burns unit' },
    { id: 'FAC-S1', name: 'Central Shelter', kind: 'SHELTER' as const, lat: jitter(CX, 0.025), lng: jitter(CY, 0.02), capacity: 500, note: 'Primary evacuation shelter' },
    { id: 'FAC-S2', name: 'North Community Hall', kind: 'SHELTER' as const, lat: jitter(CX, 0.03), lng: jitter(CY, 0.025), capacity: 250, note: 'Secondary shelter' },
    { id: 'FAC-R1', name: 'Riverside Relief Center', kind: 'RELIEF_CENTER' as const, lat: jitter(CX, 0.02), lng: jitter(CY, 0.03), capacity: 200, note: 'Supplies & medical aid' },
    { id: 'FAC-ST', name: 'Central Staging Ground', kind: 'STAGING' as const, lat: jitter(CX, 0.01), lng: jitter(CY, 0.01), capacity: 60, note: 'Unit staging & rehab' },
  ];

  const zones = [
    { id: 'Z-EVAC', name: 'Industrial Zone Evacuation', type: 'EVACUATION' as const, centerLat: CX + 0.008, centerLng: CY + 0.006, radiusM: 900, note: 'Downwind of industrial fire risk' },
    { id: 'Z-HAZ', name: 'Central Industrial Hazard Zone', type: 'HAZARDOUS' as const, centerLat: CX + 0.008, centerLng: CY + 0.006, radiusM: 500, note: 'Chemical storage proximity' },
    { id: 'Z-STG', name: 'North Junction Staging', type: 'STAGING' as const, centerLat: CX + 0.012, centerLng: CY - 0.004, radiusM: 300, note: 'Approved unit staging' },
    { id: 'Z-REL', name: 'Riverside Relief Zone', type: 'RELIEF' as const, centerLat: CX - 0.01, centerLng: CY + 0.02, radiusM: 700, note: 'Flood relief operations' },
  ];

  const roads = [
    {
      id: 'RD-1', name: 'Industrial Access Road', status: 'OPEN' as const,
      points: [ { lat: CX + 0.004, lng: CY + 0.002 }, { lat: CX + 0.008, lng: CY + 0.006 }, { lat: CX + 0.012, lng: CY + 0.01 } ],
      note: 'Primary approach to Central Industrial Zone',
    },
    {
      id: 'RD-2', name: 'North Junction Bypass', status: 'OPEN' as const,
      points: [ { lat: CX + 0.012, lng: CY - 0.006 }, { lat: CX + 0.014, lng: CY - 0.002 }, { lat: CX + 0.016, lng: CY + 0.004 } ],
      note: 'Alternate corridor to industrial zone',
    },
    {
      id: 'RD-3', name: 'Riverside Causeway', status: 'CONGESTED' as const,
      points: [ { lat: CX - 0.008, lng: CY + 0.014 }, { lat: CX - 0.01, lng: CY + 0.02 }, { lat: CX - 0.012, lng: CY + 0.026 } ],
      note: 'Heavy traffic near relief zone',
    },
  ];

  const resources = [
    { id: 'AMB-07', type: 'AMBULANCE' as const, agencyId: 'AG-EMS', capacity: 2, loc: 'City General Hospital' },
    { id: 'AMB-12', type: 'AMBULANCE' as const, agencyId: 'AG-EMS', capacity: 2, loc: 'Riverside Medical Center' },
    { id: 'AMB-15', type: 'AMBULANCE' as const, agencyId: 'AG-EMS', capacity: 2, loc: 'North Community Hall' },
    { id: 'FIRE-03', type: 'FIRE_ENGINE' as const, agencyId: 'AG-FIRE', capacity: 6, loc: 'Central Staging Ground' },
    { id: 'FIRE-06', type: 'FIRE_ENGINE' as const, agencyId: 'AG-FIRE', capacity: 6, loc: 'North Junction' },
    { id: 'POL-21', type: 'POLICE_UNIT' as const, agencyId: 'AG-POL', capacity: 4, loc: 'North Junction' },
    { id: 'POL-24', type: 'POLICE_UNIT' as const, agencyId: 'AG-POL', capacity: 4, loc: 'Central Industrial Zone' },
    { id: 'RESCUE-04', type: 'RESCUE_TEAM' as const, agencyId: 'AG-FIRE', capacity: 8, loc: 'Central Staging Ground' },
    { id: 'DRONE-02', type: 'DRONE' as const, agencyId: 'AG-CMD', capacity: 1, loc: 'Central Staging Ground' },
    { id: 'GEN-01', type: 'GENERATOR' as const, agencyId: 'AG-MUN', capacity: 1, loc: 'Central Shelter' },
    { id: 'REL-09', type: 'RELIEF_TEAM' as const, agencyId: 'AG-REL', capacity: 12, loc: 'Riverside Relief Center' },
    { id: 'MED-05', type: 'MEDICAL_SUPPLIES' as const, agencyId: 'AG-EMS', capacity: 30, loc: 'City General Hospital' },
    { id: 'VOL-03', type: 'VOLUNTEER_GROUP' as const, agencyId: 'AG-REL', capacity: 20, loc: 'North Community Hall' },
    { id: 'EV-08', type: 'EMERGENCY_VEHICLE' as const, agencyId: 'AG-MUN', capacity: 3, loc: 'Central Staging Ground' },
  ].map((r) => ({
    id: r.id,
    label: r.id,
    type: r.type,
    agencyId: r.agencyId,
    status: 'AVAILABLE' as const,
    locationName: r.loc,
    lat: jitter(CX, 0.03),
    lng: jitter(CY, 0.03),
    capacity: r.capacity,
    assignedIncidentId: null,
    updatedAt: new Date().toISOString(),
  }));

  const scenarios = [
    { id: 'SC-FIRE', name: 'Industrial Fire + Traffic Disruption', summary: 'Primary showcase: warehouse fire with workers trapped and a nearby road blockage disrupting access.', primary: true },
    { id: 'SC-FLOOD', name: 'Urban Flood', summary: 'Rising river floods the Riverside District; shelters and relief teams activate.', primary: false },
    { id: 'SC-COLLISION', name: 'Multi-Vehicle Collision', summary: 'Highway pileup at North Junction with multiple casualties.', primary: false },
    { id: 'SC-CROWD', name: 'Stadium Crowd Incident', summary: 'Crowd crush risk at a stadium event requiring police and EMS coordination.', primary: false },
    { id: 'SC-QUAKE', name: 'Earthquake Response', summary: 'Moderate earthquake triggers structural collapses across multiple districts.', primary: false },
  ];

  return {
    users,
    agencies,
    incidents: [],
    incidentUpdates: [],
    incidentReports: [],
    resources,
    tasks: [],
    communications: [],
    alerts: [],
    coordinationGaps: [],
    zones,
    facilities,
    roads,
    aiRecommendations: [],
    auditEvents: [],
    scenarios,
    meta: { seededAt: new Date().toISOString(), version: '1.0.0' },
  };
}

export const DEMO_CENTER = { lat: CX, lng: CY };
