function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface SymptomToggleProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  aiFilled?: boolean;
}

function SymptomToggle({ label, hint, value, onChange, aiFilled = false }: SymptomToggleProps) {
  const active = value === true;

  return (
    <div className={`symptom-toggle ${active ? 'symptom-toggle--active' : ''}`}>
      <span className={`symptom-toggle-status ${active ? 'symptom-toggle-status--active' : ''}`}>
        {active && <CheckIcon />}
      </span>

      <div className="symptom-toggle-text">
        <div className="symptom-toggle-label">
          {label}
          {aiFilled && <span className="symptom-toggle-ai-badge">AI</span>}
        </div>
        <div className="symptom-toggle-hint">{hint}</div>
      </div>

      <div className="symptom-toggle-pills">
        <button
          type="button"
          className={`symptom-pill ${value ? 'symptom-pill--active' : ''}`}
          onClick={() => onChange(true)}
        >
          YES
        </button>
        <button
          type="button"
          className={`symptom-pill ${!value ? 'symptom-pill--active' : ''}`}
          onClick={() => onChange(false)}
        >
          NO
        </button>
      </div>
    </div>
  );
}

export default SymptomToggle;
