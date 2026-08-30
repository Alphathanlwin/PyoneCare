import { useEffect, useState } from 'react';
import { getTelegramLinkStatus } from '../api/telegram';

// Telegram account linking (Phase 5): GET /telegram/link returns the current
// linked status plus a fresh short-lived deep link every time it's called —
// opening it in Telegram and hitting /start there is what actually links the
// account (server-side, via the webhook), so this UI just needs a way to
// launch that link and a way to re-check whether it worked.
function TelegramLinkCard() {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [linked, setLinked] = useState(false);
  const [deepLink, setDeepLink] = useState(null);
  const [error, setError] = useState('');

  const handleRefresh = async () => {
    setStatus('loading');
    setError('');
    try {
      const response = await getTelegramLinkStatus();
      setLinked(Boolean(response?.data?.linked));
      setDeepLink(response?.data?.deep_link || null);
      setStatus('ready');
    } catch {
      setError('Could not check your Telegram link status.');
      setStatus('error');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      setStatus('loading');
      setError('');
      try {
        const response = await getTelegramLinkStatus();
        if (cancelled) return;
        setLinked(Boolean(response?.data?.linked));
        setDeepLink(response?.data?.deep_link || null);
        setStatus('ready');
      } catch {
        if (!cancelled) {
          setError('Could not check your Telegram link status.');
          setStatus('error');
        }
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="telegram-link-card">
      <div className="telegram-link-header">
        <span className="telegram-link-title">
          <TelegramIcon />
          Telegram Reports
        </span>
        {linked && <span className="telegram-link-badge">Linked</span>}
      </div>

      {status === 'loading' && <p className="text-muted">Checking your Telegram link status...</p>}

      {status === 'error' && <div className="form-error">{error}</div>}

      {status === 'ready' && linked && (
        <p className="text-muted">
          Your account is linked. New assessment reports will be sent to you on Telegram automatically.
        </p>
      )}

      {status === 'ready' && !linked && deepLink && (
        <>
          <p className="text-muted">Link your Telegram account to receive your assessment reports there.</p>
          <div className="telegram-link-actions">
            <a href={deepLink} target="_blank" rel="noopener noreferrer" className="btn-primary telegram-link-btn">
              Link Telegram
            </a>
            <button type="button" className="btn-secondary telegram-link-btn" onClick={handleRefresh}>
              I've linked it — refresh
            </button>
          </div>
        </>
      )}

      {status === 'ready' && !linked && !deepLink && (
        <p className="text-muted">Telegram report delivery isn't set up for this app yet.</p>
      )}
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.5 2L1.8 7.1c-.8.3-.8.9-.1 1.1l3.2 1 1.2 3.9c.2.5.4.6.8.6.3 0 .5-.1.7-.3l1.7-1.6 3.3 2.5c.6.3 1 .2 1.2-.5l2.2-10.6c.2-.9-.3-1.3-1.5-1.2z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M4.9 9.2l7.6-5.1-6.2 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

export default TelegramLinkCard;
