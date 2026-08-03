// Rule engine that scans live operational state and surfaces
// coordination problems for a commander to act on. Rules are
// declarative and independently testable.

import { db } from '../db';
import { raiseGap, raiseAlert } from './alerts';
import { isOverdue } from './tasks';
import type { Communication, Severity } from '../types';

const ACK_SLA_MINUTES = 3; // critical comms must be acknowledged within 3 min

export interface GapScanResult {
  raised: number;
  checked: string[];
}

function minutesSince(iso: string): number {
  return (Date.now() - +new Date(iso)) / 60000;
}

/** Run all gap-detection rules over current state. Idempotent (dedupes). */
export function scanCoordinationGaps(): GapScanResult {
  const data = db();
  const checked: string[] = [];
  let raised = 0;

  // Rule 1: critical/high communication sent but not acknowledged past SLA
  checked.push('ack_missing');
  const pending = data.communications.filter(
    (c: Communication) =>
      (c.priority === 'CRITICAL' || c.priority === 'HIGH') &&
      c.ackState !== 'ACKNOWLEDGED',
  );
  for (const c of pending) {
    const mins = minutesSince(c.createdAt);
    if (mins >= ACK_SLA_MINUTES) {
      const g = raiseGap({
        type: 'ACK_MISSING',
        title: `Acknowledgement overdue: ${c.subject}`,
        detail: `${c.priority} message sent ${mins.toFixed(0)} min ago, still ${c.ackState}.`,
        incidentId: c.incidentId,
        severity: c.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        suggestedAction: 'Escalate to the target agency coordinator',
        elapsedRef: c.createdAt,
        dedupeKey: `ACK_MISSING:${c.id}`,
      });
      if (g) raised += 1;
    }
  }

  // Rule 2: overdue tasks
  checked.push('overdue_task');
  for (const t of data.tasks) {
    if (isOverdue(t)) {
      const g = raiseGap({
        type: 'OVERDUE_TASK',
        title: `Task overdue: ${t.title}`,
        detail: `Task ${t.id} passed its deadline while in ${t.status}.`,
        incidentId: t.incidentId,
        severity: t.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        suggestedAction: 'Reassign or follow up with the assigned agency',
        elapsedRef: t.deadline,
        dedupeKey: `OVERDUE_TASK:${t.id}`,
      });
      if (g) raised += 1;
    }
  }

  // Rule 3: assigned task not accepted (ASSIGNED > 5 min, no ack)
  checked.push('task_not_accepted');
  for (const t of data.tasks) {
    if (t.status === 'ASSIGNED' && minutesSince(t.updatedAt) >= 5) {
      const g = raiseGap({
        type: 'TASK_NOT_ACCEPTED',
        title: `Task not accepted: ${t.title}`,
        detail: `Assigned ${minutesSince(t.updatedAt).toFixed(0)} min ago, still not acknowledged.`,
        incidentId: t.incidentId,
        severity: 'HIGH',
        suggestedAction: 'Confirm assignment with the responding agency',
        dedupeKey: `TASK_NOT_ACCEPTED:${t.id}`,
      });
      if (g) raised += 1;
    }
  }

  // Rule 4: active critical incident with no deployed resources
  checked.push('resource_unavailable');
  const activeCritical = data.incidents.filter(
    (i) => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && ['ACTIVE', 'ESCALATED', 'VERIFIED'].includes(i.status),
  );
  for (const inc of activeCritical) {
    const deployed = data.resources.filter((r) => r.assignedIncidentId === inc.id);
    if (deployed.length === 0) {
      const g = raiseGap({
        type: 'RESOURCE_UNAVAILABLE',
        title: `No resources deployed to ${inc.id}`,
        detail: `${inc.severity} incident "${inc.title}" is ${inc.status} with zero deployed units.`,
        incidentId: inc.id,
        severity: inc.severity as Severity,
        suggestedAction: 'Run Resource Agent and deploy nearest available units',
        dedupeKey: `RESOURCE_UNAVAILABLE:${inc.id}`,
      });
      if (g) raised += 1;
    }
  }

  return { raised, checked };
}

// ---------------- Alert rule engine ----------------

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  evaluate: () => void;
}

export const ALERT_RULES: AlertRule[] = [
  {
    id: 'critical_incident',
    name: 'Critical Incident',
    description: 'Raise an alert whenever a CRITICAL incident is active.',
    evaluate: () => {
      for (const i of db().incidents) {
        if (i.severity === 'CRITICAL' && !['RESOLVED', 'ARCHIVED'].includes(i.status)) {
          raiseAlert({
            title: `CRITICAL incident active: ${i.id}`,
            detail: `${i.title} @ ${i.locationName} (${i.status})`,
            severity: 'CRITICAL',
            incidentId: i.id,
            rule: 'critical_incident',
          });
        }
      }
    },
  },
  {
    id: 'blocked_route',
    name: 'Blocked Route',
    description: 'Raise an alert when a monitored road becomes blocked.',
    evaluate: () => {
      for (const r of db().roads.filter((x) => x.status === 'BLOCKED')) {
        raiseAlert({
          title: `Route blocked: ${r.name}`,
          detail: r.note,
          severity: 'HIGH',
          rule: 'blocked_route',
        });
      }
    },
  },
];

export function evaluateAlertRules(): void {
  for (const rule of ALERT_RULES) {
    try {
      rule.evaluate();
    } catch (err) {
      console.error(`[alert-rule ${rule.id}] error:`, err);
    }
  }
}
