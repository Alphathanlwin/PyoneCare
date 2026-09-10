import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssessments } from '../api/assessment';
import RiskBadge from '../components/RiskBadge';
import type { Assessment } from '../types/api';

const RISK_LEVELS: { level: string; description: string }[] = [
  { level: 'LOW', description: 'Maintain good hygiene — brush twice daily and floss.' },
  { level: 'MEDIUM', description: 'Possible early-stage condition — see a dentist within 1 month.' },
  { level: 'HIGH', description: 'Likely active condition — see a dentist within 1 week.' },
];

const formatDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (isoString: string): string =>
  new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchAssessments = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getAssessments(1, 3);
        if (!cancelled && response.success && response.data) {
          setAssessments(response.data.items || []);
          setTotal(response.data.total || 0);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load your assessment history right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAssessments();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.full_name || user?.email || 'there';
  const lastAssessment = assessments[0];

  return (
    <div className="container dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-left">
          <h1 className="dashboard-welcome">Welcome back, {displayName.split(' ')[0]}</h1>
          <p className="dashboard-hero-sub">
            Your oral health at a glance — run a quick assessment or review your latest results.
          </p>
        </div>
        <div className="dashboard-cta-group">
          <button className="dashboard-cta dashboard-cta--live" onClick={() => navigate('/assessment/live')}>
            <SparkleIcon />
            Live AI Screening
          </button>
          <button className="dashboard-cta" onClick={() => navigate('/assessment/new')}>
            <PlusIcon />
            Start New Assessment
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Assessments</div>
          <div className="stat-value">{loading || error ? '—' : total}</div>
          <div className="stat-sub">completed so far</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Last Risk Level</div>
          {lastAssessment ? (
            <>
              <RiskBadge level={lastAssessment.risk_level} size="lg" />
              <div className="stat-sub">{formatDate(lastAssessment.created_at)}</div>
            </>
          ) : (
            <div className="stat-value stat-value--empty">—</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Last Assessment Date</div>
          <div className="stat-value">{lastAssessment ? formatDate(lastAssessment.created_at) : '—'}</div>
          <div className="stat-sub">{lastAssessment ? formatTime(lastAssessment.created_at) : 'No assessments yet'}</div>
        </div>
      </div>

      <div className="middle-row">
        <div className="recent-card">
          <div className="recent-head">
            <div className="recent-title">Recent Assessments</div>
            <Link to="/history" className="view-all-link">
              View all history
              <ArrowRightIcon />
            </Link>
          </div>

          {loading && <div className="recent-empty">Loading your assessments…</div>}

          {!loading && error && <div className="recent-empty recent-empty--error">{error}</div>}

          {!loading && !error && assessments.length === 0 && (
            <div className="recent-empty">No assessments yet. Start your first assessment above.</div>
          )}

          {!loading &&
            !error &&
            assessments.map((assessment) => (
              <Link
                key={assessment.id}
                to={`/assessment/${assessment.id}/result`}
                className="recent-row"
              >
                <span className="recent-row-date">{formatDate(assessment.created_at)}</span>
                <RiskBadge level={assessment.risk_level} size="sm" />
                <span className="recent-row-count">
                  {(assessment.conditions_detected || []).length} condition
                  {(assessment.conditions_detected || []).length === 1 ? '' : 's'} detected
                </span>
                <ChevronRightIcon />
              </Link>
            ))}
        </div>

        <div className="risk-reference-card">
          <div className="risk-reference-title">Understanding Your Risk</div>

          {RISK_LEVELS.map(({ level, description }) => (
            <div className="risk-level-row" key={level}>
              <span className={`risk-level-dot risk-level-dot--${level.toLowerCase()}`}></span>
              <div className="risk-level-text">
                <div className="risk-level-name">{level}</div>
                <div className="risk-level-desc">{description}</div>
              </div>
            </div>
          ))}

          <div className="dashboard-disclaimer">
            <InfoIcon />
            <span>Not a medical diagnosis. Consult a licensed dentist.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 1.5l1.2 3.8L13 6.5l-3.8 1.2L8 11.5l-1.2-3.8L3 6.5l3.8-1.2L8 1.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 2.5l4.5 4.5L7 11.5M2 7h9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="recent-row-chevron">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 6.3v3.4M7 4.3v.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default DashboardPage;
