import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssessments } from '../api/assessment';
import RiskBadge from '../components/RiskBadge';
import type { ApiErrorLike, Assessment } from '../types/api';

const PAGE_SIZE = 5;

const formatDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function HistoryPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Assessment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getAssessments(page, PAGE_SIZE);
        if (!cancelled && response.success) {
          setItems(response.data?.items || []);
          setTotal(response.data?.total || 0);
        }
      } catch (err) {
        if (!cancelled) {
          const e = err as ApiErrorLike;
          setError(e.response?.data?.error?.message || 'Could not load your assessment history.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <div className="container history-page">
      <div className="page-header history-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="text-muted">Review past oral health checks and treatment recommendations.</p>
        </div>
        <div className="history-meta">{total} assessments</div>
      </div>

      {loading ? (
        <div className="history-empty history-empty--loading">
          <span className="spinner"></span>
          Loading assessment history...
        </div>
      ) : error ? (
        <div className="history-empty history-empty--error">{error}</div>
      ) : items.length === 0 ? (
        <div className="history-empty">No assessments yet. Start your first screening to see history here.</div>
      ) : (
        <>
          <div className="history-list">
            {items.map((assessment) => (
              <Link key={assessment.id} to={`/assessment/${assessment.id}/result`} state={{ assessment }} className="history-item">
                <div className="history-item-header">
                  <div>
                    <div className="history-date">{formatDate(assessment.created_at)}</div>
                    <div className="history-label">Assessment #{assessment.id.slice(0, 8)}</div>
                  </div>
                  <RiskBadge level={assessment.risk_level} size="sm" />
                </div>

                <div className="history-item-body">
                  <span>{(assessment.diagnoses || []).length} condition(s) detected</span>
                  <span>View details →</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="history-pagination">
            <button type="button" className="btn-secondary" disabled={page === 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </button>
            <span className="history-page-indicator">
              Page {page} of {pageCount}
            </span>
            <button type="button" className="btn-secondary" disabled={page >= pageCount || loading} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default HistoryPage;
