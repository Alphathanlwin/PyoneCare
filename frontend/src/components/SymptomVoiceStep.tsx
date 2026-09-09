import { useState } from 'react';
import AiGuide from './AiGuide';
import ProgressDots from './ProgressDots';
import { SYMPTOM_QUESTIONS, initialSymptoms } from '../data/symptomQuestions';
import type { SymptomMap } from '../types/api';

interface SymptomVoiceStepProps {
  onComplete: (symptoms: SymptomMap) => void;
}

// Voice-guided counterpart to NewAssessmentPage's 4-step form — same
// SYMPTOM_QUESTIONS source, same symptoms{} shape, one question at a time.
// Yes/No stay disabled until Dr. Ava finishes speaking the question.
function SymptomVoiceStep({ onComplete }: SymptomVoiceStepProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SymptomMap>(initialSymptoms);
  const [confirming, setConfirming] = useState(false);
  // Tracks which question index Dr. Ava has finished speaking, rather than a
  // plain boolean reset on every index change — avoids a synchronous setState
  // in an effect; "answerable" just falls out of the comparison below.
  const [answerableIndex, setAnswerableIndex] = useState(-1);

  const question = SYMPTOM_QUESTIONS[index];
  const answerable = answerableIndex === index;
  const pose = confirming ? 'great_job' : 'idle';
  const caption = confirming ? 'Got it, thanks!' : question.question;

  const handleSpeakEnd = () => {
    setAnswerableIndex(index);
  };

  const handleAnswer = (value: boolean) => {
    const next: SymptomMap = { ...answers, [question.key]: value };
    setAnswers(next);
    setConfirming(true);

    setTimeout(() => {
      setConfirming(false);
      if (index < SYMPTOM_QUESTIONS.length - 1) {
        setIndex((i) => i + 1);
      } else {
        onComplete(next);
      }
    }, 650);
  };

  return (
    <div className="live-content">
      <div className="live-guide-row">
        <AiGuide state={pose} caption={caption} onSpeakEnd={handleSpeakEnd} size="sm" layout="float" />
      </div>

      <div className="live-question-card">
        <div className="live-icon-badge">
          <DropletIcon />
        </div>
        <h2 className="live-question-text">{question.question}</h2>
        <p className="live-question-hint">{question.hint}</p>
      </div>

      <div className="live-answers">
        <button
          type="button"
          className="live-answer-btn live-answer-btn--yes"
          disabled={!answerable}
          onClick={() => handleAnswer(true)}
        >
          <CheckIcon />
          Yes
        </button>
        <button
          type="button"
          className="live-answer-btn live-answer-btn--no"
          disabled={!answerable}
          onClick={() => handleAnswer(false)}
        >
          <XIcon />
          No
        </button>
      </div>

      <ProgressDots total={SYMPTOM_QUESTIONS.length} current={index} />
    </div>
  );
}

function DropletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12z" stroke="#0ea5e9" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default SymptomVoiceStep;
