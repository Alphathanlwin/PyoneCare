// Dr. Ava's voice — the browser's built-in SpeechSynthesis. Callers only
// ever see the onStart/onEnd contract below.

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SpeechHandle {
  cancel: () => void;
}

// The SpeechSynthesis API exposes no gender field, so voice selection is a
// name heuristic. Prefer a known female en voice; failing that, take any en
// voice that isn't a known *male* one; only then fall back to the first
// voice. Without the male exclusion the fallback often lands on "Microsoft
// David" / "Google UK English Male" and Dr. Ava sounds like a man.
const FEMALE_HINTS =
  /\bfemale\b|zira|samantha|susan|victoria|karen|tessa|fiona|moira|serena|allison|ava|joanna|salli|kimberly|aria|jenny|michelle|hazel|google (us|uk) english female|google us english/i;
const MALE_HINTS =
  /\bmale\b|david|mark|george|james|\bguy\b|tony|ryan|daniel|\balex\b|fred|oliver|arthur|brian|christopher|eric|google uk english male/i;

// Chrome populates getVoices() lazily; the first call right after a page load
// is usually empty and only fills in once "voiceschanged" fires. Cache the
// resolved voice, and never block a spoken line for longer than this if the
// list simply never arrives.
const VOICE_READY_TIMEOUT_MS = 350;

let cachedVoice: SpeechSynthesisVoice | null = null;
let pendingVoiceLoad: Promise<void> | null = null;

function pickSystemVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const pool = en.length > 0 ? en : voices;

  return (
    pool.find((v) => FEMALE_HINTS.test(v.name)) ||
    pool.find((v) => !MALE_HINTS.test(v.name)) ||
    pool[0] ||
    null
  );
}

// Resolves once getVoices() is non-empty, or after VOICE_READY_TIMEOUT_MS.
// Not memoised on a failed (still-empty) result, so a later call re-waits.
function waitForVoices(): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve();
  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) return Promise.resolve();
  if (pendingVoiceLoad) return pendingVoiceLoad;

  pendingVoiceLoad = new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener('voiceschanged', onChange);
      clearTimeout(timer);
      pendingVoiceLoad = null;
      resolve();
    };
    const onChange = () => {
      if (synth.getVoices().length > 0) finish();
    };
    synth.addEventListener('voiceschanged', onChange);
    const timer = setTimeout(finish, VOICE_READY_TIMEOUT_MS);
  });
  return pendingVoiceLoad;
}

async function resolveVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice) return cachedVoice;
  await waitForVoices();
  const voice = pickSystemVoice();
  if (voice) cachedVoice = voice;
  return voice;
}

// Prime the voice list as early as possible so the first spoken line (the
// live-screening intro) doesn't race an empty getVoices().
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  void resolveVoice();
}

export function speak(text: string, options: SpeakOptions = {}): SpeechHandle {
  const { onStart, onEnd } = options;
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const duration = Math.max(900, (text || '').split(/\s+/).length * 260);

  if (!hasSpeech || !text) {
    onStart?.();
    const timer = setTimeout(() => onEnd?.(), duration);
    return { cancel: () => clearTimeout(timer) };
  }

  // Chrome's SpeechSynthesis is known to silently drop onstart/onend/onerror
  // — most reliably reproduced by calling cancel() immediately before a new
  // speak(), which is exactly what happens every time the quiz advances to
  // the next question. Without a fallback timer, callers gated on onEnd
  // (e.g. "answerable" in SymptomVoiceStep) would then be stuck forever, so
  // guarantee onEnd fires at most once no matter what the browser does.
  let settled = false;
  let cancelled = false;
  let safetyTimer: ReturnType<typeof setTimeout> | undefined;

  const finish = () => {
    if (settled) return;
    settled = true;
    if (safetyTimer) clearTimeout(safetyTimer);
    onEnd?.();
  };

  // Stop whatever is currently speaking right away, even though the new
  // utterance can't start until the voice list resolves a tick later.
  window.speechSynthesis.cancel();

  const startUtterance = (voice: SpeechSynthesisVoice | null) => {
    if (cancelled) return;

    safetyTimer = setTimeout(finish, duration + 2000);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => onStart?.();
    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  };

  // If the voice list is already populated this resolves synchronously-ish on
  // the microtask queue; on a cold page load it waits (briefly) for
  // "voiceschanged" so we don't fall back to the browser default (often male).
  void resolveVoice().then(startUtterance);

  return {
    cancel: () => {
      cancelled = true;
      settled = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      window.speechSynthesis.cancel();
    },
  };
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
