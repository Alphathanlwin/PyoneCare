import { useState } from 'react';
import { chatIntake } from '../api/chat';
import { SYMPTOM_QUESTIONS } from '../data/symptomQuestions';
import { apiErrorMessage } from '../utils/apiError';
import type { SymptomMap } from '../types/api';

const SYMPTOM_LABELS: Record<string, string> = Object.fromEntries(
  SYMPTOM_QUESTIONS.map((s) => [s.key, s.label]),
);

const INTAKE_ERROR_FALLBACK =
  "Dr. Ava's AI assistant is unavailable right now — please use the toggles below instead.";

interface SymptomIntakeChatProps {
  onApply: (symptoms: SymptomMap) => void;
}

// Optional free-text entry point (Phase 4): lets the user describe their
// symptoms in their own words and have /chat/intake pre-fill the matching
// YES/NO toggles below, which the user can still review and override.
function SymptomIntakeChat({ onApply }: SymptomIntakeChatProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedLabels, setAppliedLabels] = useState<string[] | null>(null);

  const handleParse = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    setAppliedLabels(null);

    try {
      const response = await chatIntake(text.trim());
      const symptoms = response?.data?.symptoms || {};
      const keys = Object.keys(symptoms);

      if (keys.length === 0) {
        setError("Dr. Ava couldn't match any known symptoms in that description — try being more specific.");
      } else {
        onApply(symptoms);
        setAppliedLabels(keys.map((key) => SYMPTOM_LABELS[key] || key));
        setText('');
      }
    } catch (err) {
      setError(apiErrorMessage(err, INTAKE_ERROR_FALLBACK));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="intake-chat-trigger" onClick={() => setOpen(true)}>
        <SparkleIcon />
        Describe your symptoms in your own words
      </button>
    );
  }

  return (
    <div className="intake-chat card">
      <div className="intake-chat-header">
        <span className="intake-chat-title">
          <SparkleIcon />
          Describe your symptoms
        </span>
        <button type="button" className="intake-chat-close" onClick={() => setOpen(false)} aria-label="Close">
          &times;
        </button>
      </div>
      <p className="intake-chat-hint">
        Tell Dr. Ava what's going on and she'll fill in the matching toggles below for you to review.
      </p>
      <textarea
        className="form-input intake-chat-textarea"
        rows={3}
        placeholder="e.g. My tooth hurts when I drink something cold and my gums bleed a little when I brush."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      <div className="intake-chat-actions">
        <button
          type="button"
          className="btn-primary intake-chat-submit"
          onClick={handleParse}
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Reading...
            </>
          ) : (
            'Fill in from my description'
          )}
        </button>
      </div>
      {error && <div className="form-error intake-chat-error">{error}</div>}
      {appliedLabels && (
        <div className="intake-chat-applied">
          Filled in: {appliedLabels.join(', ')}. Double-check the toggles below.
        </div>
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 1.5l1.2 3.3 3.3 1.2-3.3 1.2L8 10.5l-1.2-3.3-3.3-1.2 3.3-1.2L8 1.5z"
        fill="currentColor"
      />
      <path d="M13 9.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6z" fill="currentColor" />
    </svg>
  );
}

export default SymptomIntakeChat;
