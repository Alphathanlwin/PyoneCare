import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAssessment } from '../api/assessment';
import AiGuide from '../components/AiGuide';
import RiskBadge from '../components/RiskBadge';
import DiagnosisCard from '../components/DiagnosisCard';
import RecommendationCard from '../components/RecommendationCard';
import ChatPanel from '../components/ChatPanel';
import NearbyClinics from '../components/NearbyClinics';
import { CONDITION_LABELS } from '../data/clinicalLabels';
import { buildResultSummary } from '../utils/resultSummary';

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function ResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(location.state?.assessment || null);
  const [loading, setLoading] = useState(!location.state?.assessment);
  const [error, setError] = useState('');

  useEffect(() => {
    if (assessment) return undefined;

    let cancelled = false;

    const fetchAssessment = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getAssessment(id);
        if (!cancelled && response.success && response.data) {
          setAssessment(response.data);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load this assessment result.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAssessment();
    return () => {
      cancelled = true;
    };
  }, [id, assessment]);

  if (loading) {
    return (
      <div className="container result-page">
        <div className="result-loading">
          <span className="spinner"></span>
          Loading your result...
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container result-page">
        <div className="result-error">
          <p>{error || 'This assessment could not be found.'}</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const diagnoses = assessment.diagnoses || [];
  const recommendations = diagnoses.flatMap((d) =>
    (d.recommendations || []).map((r) => ({
      ...r,
      conditionLabel: CONDITION_LABELS[d.condition] || d.condition,
    }))
  );

  return (
    <div className="container result-page">
      <div className="result-header">
        <div className="result-header-top">
          <span className="result-date">{formatDate(assessment.created_at)}</span>
          <RiskBadge level={assessment.risk_level} size="lg" />
        </div>

        <div className="result-ava-row">
          <AiGuide state="reveal" caption={buildResultSummary(assessment)} size="sm" layout="float" />
        </div>

        <h1 className="page-title">Your Assessment Result</h1>
      </div>

      <section className="result-section">
        <h2 className="result-section-title">Conditions Detected</h2>
        {diagnoses.length === 0 ? (
          <p className="text-muted">No specific conditions were detected. Keep up your oral hygiene routine!</p>
        ) : (
          <div className="diagnosis-list">
            {diagnoses.map((d) => (
              <DiagnosisCard
                key={d.id}
                condition={d.condition}
                explanation={d.explanation}
                triggeredRules={d.triggered_rules}
              />
            ))}
          </div>
        )}
      </section>

      {recommendations.length > 0 && (
        <section className="result-section">
          <h2 className="result-section-title">Recommendations</h2>
          <div className="recommendation-timeline">
            {recommendations.map((r) => (
              <RecommendationCard key={r.id} action={r.action} urgency={r.urgency} conditionLabel={r.conditionLabel} />
            ))}
          </div>
        </section>
      )}

      <section className="result-section">
        <h2 className="result-section-title">Find a Dentist</h2>
        <NearbyClinics />
      </section>

      <section className="result-section">
        <h2 className="result-section-title">Have a Question?</h2>
        <ChatPanel assessmentId={assessment.id} />
      </section>

      <div className="result-disclaimer">
        <InfoIcon />
        This is not a medical diagnosis. Consult a licensed dentist for an accurate evaluation.
      </div>

      <div className="result-actions">
        <button type="button" className="btn-secondary" onClick={() => navigate('/history')}>
          View History
        </button>
        <button type="button" className="btn-primary" onClick={() => navigate('/assessment/new')}>
          Start New Assessment
        </button>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 6.3v3.4M7 4.3v.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default ResultPage;
