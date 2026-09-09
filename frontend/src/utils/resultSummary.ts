import { CONDITION_LABELS } from '../data/clinicalLabels';
import type { Assessment } from '../types/api';

// Shared by LiveScreeningPage's reveal step and ResultPage's Dr. Ava treatment
// so both surfaces describe the same assessment the same way.
export function buildResultSummary(assessment: Assessment | null | undefined): string {
  const diagnoses = assessment?.diagnoses || [];
  const riskLevel = assessment?.risk_level;

  if (diagnoses.length === 0) {
    return "Good news — I didn't spot anything concerning. Keep up your routine!";
  }

  const topLabel = CONDITION_LABELS[diagnoses[0].condition] || diagnoses[0].condition;
  const others = diagnoses.length - 1;
  const suffix = others > 0 ? ` and ${others} other thing${others === 1 ? '' : 's'}` : '';

  if (riskLevel === 'HIGH') {
    return `I found signs of ${topLabel}${suffix}. I'd recommend seeing a dentist soon.`;
  }
  if (riskLevel === 'MEDIUM') {
    return `I spotted signs of ${topLabel}${suffix} — worth keeping an eye on.`;
  }
  return `I noticed some early signs of ${topLabel}${suffix} — nothing urgent, just something to watch.`;
}
