import { useEffect, useRef, useState } from 'react';
import AiGuide from './AiGuide';
import ProgressDots from './ProgressDots';
import MouthGuide from './MouthGuide';
import PhotoUpload from './PhotoUpload';
import { CAPTURE_ANGLES, initialPhotos, type PhotoMap } from '../data/captureAngles';

type CameraStatus = 'requesting' | 'granted' | 'denied';

interface GuidedCaptureProps {
  onComplete: (photos: PhotoMap) => void;
}

// Self-contained capture → confirm/retake → next-angle sub-flow, mirroring
// SymptomVoiceStep's shape: owns its own state machine, calls onComplete once
// with the full {front, upper, lower} base64 payload.
function GuidedCapture({ onComplete }: GuidedCaptureProps) {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('requesting');
  // Many browsers show the camera permission prompt as a small address-bar
  // icon rather than a modal — easy to miss, and the getUserMedia() promise
  // just sits pending until the user notices and responds to it. Rather than
  // leaving them on a bare spinner indefinitely, surface a manual way out
  // after a few seconds.
  const [slowRequest, setSlowRequest] = useState(false);
  const [angleIndex, setAngleIndex] = useState(0);
  const [pendingCapture, setPendingCapture] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoMap>(initialPhotos);
  const [flash, setFlash] = useState(false);
  // True once the (re)mounted <video>'s first frame has real dimensions —
  // guards the shutter against a race right after mount/retake, where the
  // element exists but videoWidth is still 0.
  const [videoReady, setVideoReady] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Set by handleSkipToUpload() — guards against a permission prompt the
  // user already skipped past resolving *after* the fact and silently
  // flipping them back into the camera view from the upload fallback.
  const skippedRef = useRef(false);

  const angle = CAPTURE_ANGLES[angleIndex];

  useEffect(() => {
    let cancelled = false;
    const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    const request = getUserMedia
      ? getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        })
      : Promise.reject(new Error('getUserMedia unsupported'));

    request
      .then((stream) => {
        if (cancelled || skippedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraStatus('granted');
      })
      .catch(() => {
        if (!cancelled) setCameraStatus('denied');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cameraStatus !== 'requesting') return undefined;
    const timer = setTimeout(() => setSlowRequest(true), 6000);
    return () => clearTimeout(timer);
  }, [cameraStatus]);

  const handleSkipToUpload = () => {
    skippedRef.current = true;
    setCameraStatus('denied');
  };

  // Re-attaches the already-granted stream whenever the <video> element
  // (re)mounts — it unmounts during the confirm/retake preview swap.
  const attachVideo = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) el.srcObject = streamRef.current;
  };

  const handleShutter = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    // Some devices ignore the `ideal` getUserMedia constraint, so clamp here
    // too — keeps captured-photo memory/upload size bounded regardless.
    const MAX_DIMENSION = 900;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setPendingCapture(canvas.toDataURL('image/jpeg', 0.85));
  };

  const advance = (next: PhotoMap) => {
    setPhotos(next);
    setPendingCapture(null);
    setVideoReady(false);
    if (angleIndex < CAPTURE_ANGLES.length - 1) {
      setAngleIndex((i) => i + 1);
    } else {
      onComplete(next);
    }
  };

  const handleUsePhoto = () => {
    advance({ ...photos, [angle.id]: pendingCapture });
  };

  const handleFallbackPhoto = (dataUrl: string | null) => {
    const next: PhotoMap = { ...photos, [angle.id]: dataUrl };
    setPhotos(next);
    if (!dataUrl) return; // removed via PhotoUpload — let the user re-pick
    if (angleIndex < CAPTURE_ANGLES.length - 1) {
      setAngleIndex((i) => i + 1);
    } else {
      onComplete(next);
    }
  };

  if (cameraStatus === 'denied') {
    return (
      <div className="live-content live-content--center">
        <AiGuide
          state="sorry"
          caption="No worries, let's use photos you already have."
          size="md"
          layout="stage"
        />

        <span className="live-angle-chip">
          <CameraOffIcon />
          {angle.label} · {angleIndex + 1} of {CAPTURE_ANGLES.length}
        </span>

        <PhotoUpload value={photos[angle.id]} onChange={handleFallbackPhoto} />

        <ProgressDots total={CAPTURE_ANGLES.length} current={angleIndex} />
      </div>
    );
  }

  return (
    <div className="live-content live-content--flush">
      <div className="live-camera">
        <div className={`live-camera-flash ${flash ? 'live-camera-flash--active' : ''}`}></div>

        <div className="live-camera-top">
          <span className="live-angle-chip">
            <CameraIcon />
            {angle.label} · {angleIndex + 1} of {CAPTURE_ANGLES.length}
          </span>
        </div>

        {cameraStatus === 'requesting' && (
          <div className="live-camera-loading">
            <span className="spinner"></span>
            <p>Turning on your camera…</p>
            {slowRequest && (
              <div className="live-camera-slow">
                <p className="live-camera-slow-hint">
                  Still waiting? Check your browser's address bar for a camera permission prompt.
                </p>
                <button type="button" className="live-link-btn" onClick={handleSkipToUpload}>
                  Skip camera, upload a photo instead
                </button>
              </div>
            )}
          </div>
        )}

        {cameraStatus === 'granted' && pendingCapture && (
          <img src={pendingCapture} alt="Captured preview" className="live-camera-video" />
        )}

        {cameraStatus === 'granted' && !pendingCapture && (
          <>
            <video
              ref={attachVideo}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setVideoReady(true)}
              className="live-camera-video"
            />
            <MouthGuide shape={angle.shape} />
            <p className="live-guide-hint">{angle.hint}</p>
          </>
        )}

        <div className="live-ava-float">
          <AiGuide
            state={pendingCapture ? 'great_job' : 'look_here'}
            caption={pendingCapture ? 'Looks good — keep it, or try again?' : angle.caption}
            size="sm"
            layout="float"
          />
        </div>
      </div>

      <div className="live-capture-controls">
        <ProgressDots total={CAPTURE_ANGLES.length} current={angleIndex} />

        {pendingCapture ? (
          <div key="confirm" className="live-confirm-row">
            <button
              type="button"
              className="live-confirm-btn live-confirm-btn--retake"
              onClick={() => {
                setPendingCapture(null);
                setVideoReady(false);
              }}
            >
              <RefreshIcon />
              Retake
            </button>
            <button type="button" className="live-confirm-btn live-confirm-btn--use" onClick={handleUsePhoto}>
              <CheckIcon />
              Use Photo
            </button>
          </div>
        ) : (
          <div key="capture" className="live-capture-row">
            <div className="live-capture-side" aria-hidden="true">
              <ImageIcon />
            </div>
            <button
              type="button"
              className="live-shutter"
              disabled={cameraStatus !== 'granted' || !videoReady}
              onClick={handleShutter}
              aria-label="Capture photo"
            >
              <span className="live-shutter-core"></span>
            </button>
            <div className="live-capture-side" aria-hidden="true">
              <RefreshIcon />
            </div>
          </div>
        )}

        <p className="live-capture-hint">
          {pendingCapture ? 'Retake if it looks blurry or off-center' : 'Tap to capture · Hold steady'}
        </p>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 2l20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 15l-5-5-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10a9 9 0 0 1 15.3-5.3L21 7M21 4v3.5h-3.5M21 14a9 9 0 0 1-15.3 5.3L3 17M3 20v-3.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default GuidedCapture;
