interface RiskBadgeProps {
  level: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const normalized = (level || '').toUpperCase();

  return (
    <span className={`risk-badge risk-badge--${normalized.toLowerCase()} risk-badge--${size}`}>
      <span className="risk-badge-dot"></span>
      {normalized}
    </span>
  );
}

export default RiskBadge;
