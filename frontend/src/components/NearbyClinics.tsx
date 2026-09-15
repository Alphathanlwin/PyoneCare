import { useState, type FormEvent } from 'react';
import { getNearbyClinics, searchClinics } from '../api/clinic';
import { apiErrorMessage } from '../utils/apiError';
import type { Clinic } from '../types/api';

const CLINIC_ERROR_FALLBACK =
  'Nearby clinic search is unavailable right now — please try again later.';

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

interface LocationErrorLike {
  code?: number | string;
  message?: string;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      const err = new Error('insecure context') as Error & { code?: string };
      err.code = 'INSECURE_CONTEXT';
      reject(err);
      return;
    }
    if (!navigator.geolocation) {
      const err = new Error('unsupported') as Error & { code?: string };
      err.code = 'UNSUPPORTED';
      reject(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

// When precise location isn't available we don't dead-end — we just tell the
// user to use the area box below instead.
function locationErrorMessage(err: unknown): string {
  const e = err as LocationErrorLike;
  if (e.code === 'INSECURE_CONTEXT' || e.code === 'UNSUPPORTED' || e.code === 1) {
    return "Couldn't use your device location. Type your area below to search instead.";
  }
  if (e.code === 2) {
    return "Your location couldn't be determined. Type your area below to search instead.";
  }
  if (e.code === 3) {
    return 'Getting your location timed out. Type your area below, or try again.';
  }
  return "Couldn't get your location. Type your area below to search instead.";
}

// "Find nearby clinics" (Phase 5): tries precise geolocation first, and always
// offers a free-text area search (GET /clinics/search) as a fallback that
// works with no location permission and on any origin.
function NearbyClinics() {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [error, setError] = useState('');
  const [area, setArea] = useState('');
  const [started, setStarted] = useState(false);

  const runNearby = async () => {
    setStatus('loading');
    setError('');
    setStarted(true);

    let position: GeolocationPosition;
    try {
      position = await getCurrentPosition();
    } catch (err) {
      setError(locationErrorMessage(err));
      setStatus('error');
      return;
    }

    try {
      const { latitude, longitude } = position.coords;
      const response = await getNearbyClinics(latitude, longitude);
      setClinics(response?.data?.items || []);
      setStatus('done');
    } catch (err) {
      setError(apiErrorMessage(err, CLINIC_ERROR_FALLBACK));
      setStatus('error');
    }
  };

  const runAreaSearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = area.trim();
    if (q.length < 2 || status === 'loading') return;

    setStatus('loading');
    setError('');
    setStarted(true);

    try {
      const response = await searchClinics(q);
      setClinics(response?.data?.items || []);
      setStatus('done');
    } catch (err) {
      setError(apiErrorMessage(err, CLINIC_ERROR_FALLBACK));
      setStatus('error');
    }
  };

  const areaForm = (
    <form className="nearby-clinics-area" onSubmit={runAreaSearch}>
      <input
        type="text"
        className="form-input"
        placeholder="Search by area, e.g. Mandalay or Yangon"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        className="btn-secondary"
        disabled={status === 'loading' || area.trim().length < 2}
      >
        Search
      </button>
    </form>
  );

  if (!started) {
    return (
      <div className="nearby-clinics">
        <button type="button" className="btn-secondary nearby-clinics-trigger" onClick={runNearby}>
          <PinIcon />
          Find clinics near me
        </button>
        {areaForm}
      </div>
    );
  }

  return (
    <div className="nearby-clinics">
      <div className="nearby-clinics-header">
        <span className="nearby-clinics-title">
          <PinIcon />
          Dental Clinics
        </span>
        {status !== 'loading' && (
          <button type="button" className="nearby-clinics-refresh" onClick={runNearby}>
            Use my location
          </button>
        )}
      </div>

      {areaForm}

      {status === 'loading' && (
        <div className="nearby-clinics-loading">
          <span className="spinner"></span>
          Searching…
        </div>
      )}

      {status === 'error' && <div className="form-error nearby-clinics-error">{error}</div>}

      {status === 'done' && clinics.length === 0 && (
        <p className="text-muted">No dental clinics were found.</p>
      )}

      {status === 'done' && clinics.length > 0 && (
        <div className="clinic-list">
          {clinics.map((clinic) => (
            <div key={clinic.place_id} className="clinic-card">
              <div className="clinic-card-main">
                <div className="clinic-card-name">{clinic.name}</div>
                {clinic.address && <div className="clinic-card-address">{clinic.address}</div>}
                <div className="clinic-card-meta">
                  {clinic.rating != null && (
                    <span className="clinic-card-rating">
                      <StarIcon />
                      {clinic.rating.toFixed(1)}
                    </span>
                  )}
                  {clinic.distance_km != null && (
                    <span className="clinic-card-distance">{clinic.distance_km.toFixed(1)} km away</span>
                  )}
                </div>
              </div>
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`} className="clinic-card-phone">
                  <PhoneIcon />
                  {clinic.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 14.5S13 10 13 6.5a5 5 0 10-10 0C3 10 8 14.5 8 14.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.3l-4 2.2 1-4.4-3.4-3 4.5-.5L8 1.5z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 2.5h2.2l1 3-1.5 1.3a8 8 0 003.5 3.5l1.3-1.5 3 1V12a1 1 0 01-1 1C6.6 13 3 9.4 3 4.5V2.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default NearbyClinics;
