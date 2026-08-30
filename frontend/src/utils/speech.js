// Dr. Ava's voice — the browser's built-in SpeechSynthesis. Callers only
// ever see the onStart/onEnd contract below.

function pickSystemVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /female|zira|samantha|susan|google us english/i.test(v.name)) ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0] ||
    null
  );
}

export function speak(text, { onStart, onEnd, rate = 1, pitch = 1.05, volume = 1 } = {}) {
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
  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(safetyTimer);
    onEnd?.();
  };
  const safetyTimer = setTimeout(finish, duration + 2000);

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  const voice = pickSystemVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => onStart?.();
  utterance.onend = finish;
  utterance.onerror = finish;

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => {
      clearTimeout(safetyTimer);
      settled = true;
      window.speechSynthesis.cancel();
    },
  };
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
