import { describe, it, expect } from 'vitest';
import { RuleBasedProvider } from '../src/lib/ai/rule-based-provider';

const ai = new RuleBasedProvider();

describe('RuleBasedProvider — deterministic triage', () => {
  it('classifies the industrial fire scenario as FIRE / CRITICAL', async () => {
    const r = await ai.classifyIncident({
      text: 'Heavy smoke reported near industrial area. Fire spreading toward nearby warehouse. Multiple workers may be trapped.',
      locationName: 'Central Industrial Zone',
    });
    expect(r.category).toBe('FIRE');
    expect(r.severity).toBe('CRITICAL');
    expect(r.agencies).toContain('FIRE');
    expect(r.agencies).toContain('EMS');
    expect(r.requiredResources).toContain('FIRE_ENGINE');
    expect(r.risks.length).toBeGreaterThan(0);
  });

  it('classifies a road blockage report', async () => {
    const r = await ai.classifyIncident({
      text: 'Large tree blocking hospital emergency entrance.',
      locationName: 'City General Hospital',
    });
    expect(r.category).toBe('ROAD_BLOCKAGE');
    expect(r.agencies).toContain('MUNICIPAL');
  });

  it('is deterministic (same input → same output)', async () => {
    const input = { text: 'Vehicle collision with injuries at North Junction', locationName: 'North Junction' };
    const a = await ai.classifyIncident(input);
    const b = await ai.classifyIncident(input);
    expect(a.category).toBe(b.category);
    expect(a.severity).toBe(b.severity);
  });

  it('detects missing information', async () => {
    const r = await ai.classifyIncident({ text: 'People trapped somewhere' });
    expect(r.missingInfo.length).toBeGreaterThan(0);
  });

  it('detects related/duplicate reports', async () => {
    const r = await ai.detectRelatedIncidents({
      candidate: { text: 'Smoke seen near railway station', locationName: 'Railway Station' },
      existing: [
        { id: 'INC-1', title: 'Fire alarm', text: 'Fire alarm triggered close to railway station', locationName: 'Railway Station' },
        { id: 'INC-2', title: 'Flood', text: 'Water rising in riverside district', locationName: 'Riverside' },
      ],
    });
    expect(r.matches[0]?.id).toBe('INC-1');
    expect(r.matches[0]?.likelihood).toBeGreaterThan(0.2);
  });

  it('recommends nearest resources up to severity need', async () => {
    const r = await ai.recommendResources({
      incidentTitle: 'Fire',
      incidentType: 'FIRE',
      severity: 'CRITICAL',
      requiredResourceTypes: ['FIRE_ENGINE', 'AMBULANCE'],
      available: [
        { id: 'FIRE-03', label: 'FIRE-03', type: 'FIRE_ENGINE', distanceKm: 1.2 },
        { id: 'FIRE-06', label: 'FIRE-06', type: 'FIRE_ENGINE', distanceKm: 4.8 },
        { id: 'AMB-07', label: 'AMB-07', type: 'AMBULANCE', distanceKm: 2.1 },
      ],
    });
    expect(r.picks.length).toBe(3);
    expect(r.picks[0].resourceId).toBe('FIRE-03'); // nearest fire engine first
  });

  it('assesses escalation risk with worsening signals', async () => {
    const r = await ai.assessEscalationRisk({
      incidentTitle: 'Fire',
      severity: 'HIGH',
      status: 'ACTIVE',
      ageMinutes: 40,
      openGaps: 2,
      worseningSignals: ['fire spreading to adjacent warehouse'],
    });
    expect(r.shouldEscalate).toBe(true);
    expect(r.toSeverity).toBe('CRITICAL');
  });
});
