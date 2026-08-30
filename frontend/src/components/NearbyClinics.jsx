import { useState } from 'react';
import { getNearbyClinics } from '../api/clinic';

const SEARCH_RADIUS_M = 5000;

function extractErrorMessage(err) {
  return (
    err.response?.data?.error?.message ||
    err.response?.data?.detail ||
    'Nearby clinic search is unavailable right now — please try again later.'
  );
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support location access.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

function locationErrorMessage(err) {
  if (err.code === 1) {
    return 'Location access was denied. Please allow location access in your browser to find nearby clinics.';
  }
  if (err.code === 2) {
    return 'Your location could not be determined. Please try again.';
  }
  if (err.code === 3) {
    return 'Getting your location timed out. Please try again.';
  }
  return err.message || 'Could not access your location.';
}

// "Find nearby clinics" (Phase 5): geolocates the user, then calls
// GET /clinics/nearby, degrading gracefully if location is denied or the
// Google Places-backed backend is unavailable (CLINIC_SERVICE_UNAVAILABLE).
function NearbyClinics() {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [clinics, setClinics] = useState([]);
  const [error, setError] = useState('');

  const handleFind = async () => {
    setStatus('loading');
    setError('');

    let position;
    try {
      position = await getCurrentPosition();
    } catch (err) {
      setError(locationErrorMessage(err));
      setStatus('error');
      return;
    }

    try {
      const { latitude, longitude } = position.coords;
      const response = await getNearbyClinics(latitude, longitude, SEARCH_RADIUS_M);
      setClinics(response?.data?.items || []);
      setStatus('done');
    } catch (err) {
      setError(extractErrorMessage(err));
      setStatus('error');
    }
  };

  if (status === 'idle') {
    return (
      <button type="button" className="btn-secondary nearby-clinics-trigger" onClick={handleFind}>
        <PinIcon />
        Find nearby clinics
      </button>
    );
  }

  return (
    <div className="nearby-clinics">
      <div className="nearby-clinics-header">
        <span className="nearby-clinics-title">
          <PinIcon />
          Nearby Dental Clinics
        </span>
        {status !== 'loading' && (
          <button type="button" className="nearby-clinics-refresh" onClick={handleFind}>
            Refresh
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="nearby-clinics-loading">
          <span className="spinner"></span>
          Finding clinics near you...
        </div>
      )}

      {status === 'error' && <div className="form-error nearby-clinics-error">{error}</div>}

      {status === 'done' && clinics.length === 0 && (
        <p className="text-muted">No dental clinics were found nearby.</p>
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
                  <span className="clinic-card-distance">{clinic.distance_km.toFixed(1)} km away</span>
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
