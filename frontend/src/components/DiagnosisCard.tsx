import { CONDITION_LABELS } from '../data/clinicalLabels';

function formatTriggeredRule(rule: string): string {
  const match = /^(\w+)\(([^)]*)\)$/.exec(rule);
  if (!match) return rule;

  const [, predicate, argsStr] = match;
  const args = argsStr.split(',').map((a) => a.trim());
  const conditionLabel = CONDITION_LABELS[args[0]?.toUpperCase()] || args[0];

  if (predicate === 'possible') {
    return `Matched the symptom pattern for ${conditionLabel}`;
  }
  if (predicate === 'risk_level') {
    const level = args[1] || '';
    return `Risk level assessed as ${level.charAt(0).toUpperCase()}${level.slice(1)}`;
  }
  return rule;
}

interface DiagnosisCardProps {
  condition: string;
  explanation: string;
  triggeredRules?: string[];
}

function DiagnosisCard({ condition, explanation, triggeredRules = [] }: DiagnosisCardProps) {
  const label = CONDITION_LABELS[condition] || condition;

  return (
    <div className="diagnosis-card">
      <div className="diagnosis-card-head">
        <span className="diagnosis-card-icon">
          <WarningIcon />
        </span>
        <h3 className="diagnosis-card-title">{label}</h3>
      </div>

      <p className="diagnosis-card-explanation">{explanation}</p>

      {triggeredRules.length > 0 && (
        <ul className="diagnosis-card-rules">
          {triggeredRules.map((rule) => (
            <li key={rule}>{formatTriggeredRule(rule)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4.5M12 17.2v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default DiagnosisCard;
