import { URGENCY_LABELS, URGENT_LEVELS } from '../data/clinicalLabels';

interface RecommendationCardProps {
  action: string;
  urgency: string;
  conditionLabel?: string;
}

function RecommendationCard({ action, urgency, conditionLabel }: RecommendationCardProps) {
  const isUrgent = URGENT_LEVELS.has(urgency);
  const label = URGENCY_LABELS[urgency] || urgency;

  return (
    <div className="recommendation-card">
      <span className={`recommendation-icon ${isUrgent ? 'recommendation-icon--urgent' : ''}`}>
        {isUrgent ? <ExclamationIcon /> : <CalendarIcon />}
      </span>

      <div className="recommendation-body">
        {conditionLabel && <div className="recommendation-condition">{conditionLabel}</div>}
        <p className="recommendation-action">{action}</p>
        <span className={`recommendation-urgency recommendation-urgency--${(urgency || '').toLowerCase()}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ExclamationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5v6M12 16.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default RecommendationCard;
