import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { speak, stopSpeaking, type SpeechHandle } from '../utils/speech';
import type { AiGuideState } from '../types/ui';
import avaWelcome from '../assets/ava/ava-welcome.png';
import avaThinking from '../assets/ava/ava-thinking.png';
import avaWarm from '../assets/ava/ava-warm.png';
import avaSorry from '../assets/ava/ava-sorry.png';

// Five semantic poses map onto four illustrated portraits — "look here" and
// "great job" reuse the welcome art (same as the Pencil source designs, which
// only render a dedicated portrait for processing/reveal/fallback moments).
const POSE_IMAGES: Record<AiGuideState, string> = {
  idle: avaWelcome,
  look_here: avaWelcome,
  great_job: avaWelcome,
  processing: avaThinking,
  reveal: avaWarm,
  sorry: avaSorry,
};

const POSE_GLOW: Record<AiGuideState, string> = {
  idle: '#0ea5e9',
  look_here: '#0ea5e9',
  great_job: '#0ea5e9',
  processing: '#0ea5e9',
  reveal: '#f59e0b',
  sorry: '#94a3b8',
};

interface AiGuideProps {
  state?: AiGuideState;
  caption?: string;
  onSpeakEnd?: () => void;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'stage' | 'float';
}

// isSpeaking only ever flips inside the speak() onstart/onend callbacks below —
// real async events from the TTS engine, not a synchronous effect side-effect.
function AiGuide({
  state = 'idle',
  caption,
  onSpeakEnd,
  size = 'lg',
  layout = 'stage',
}: AiGuideProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [frame, setFrame] = useState(0);
  const cancelRef = useRef<SpeechHandle | null>(null);

  useEffect(() => {
    if (!isSpeaking) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % 3), 140);
    return () => clearInterval(id);
  }, [isSpeaking]);

  useEffect(() => {
    if (!caption) return undefined;

    cancelRef.current = speak(caption, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        onSpeakEnd?.();
      },
    });

    return () => {
      cancelRef.current?.cancel();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caption]);

  const image = POSE_IMAGES[state] || POSE_IMAGES.idle;
  const glow = POSE_GLOW[state] || POSE_GLOW.idle;

  const portrait = (
    <div className="ai-guide-stage" style={{ '--pose-glow': glow } as CSSProperties}>
      <div className="ai-guide-glow"></div>
      <div className={`ai-guide-ring ${isSpeaking ? 'ai-guide-ring--active' : ''}`}></div>
      <div className="ai-guide-portrait-wrap">
        <img src={image} alt="Dr. Ava" className="ai-guide-portrait" />
      </div>
    </div>
  );

  const bubble = caption && (
    <div className="ai-guide-bubble">
      <div className="ai-guide-bubble-head">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`ai-guide-dot ${isSpeaking && frame === i ? 'ai-guide-dot--active' : ''}`}
          ></span>
        ))}
        <span className="ai-guide-speaker-label">
          {isSpeaking ? 'Dr. Ava is speaking' : 'Dr. Ava'}
        </span>
      </div>
      <p className="ai-guide-caption">{caption}</p>
    </div>
  );

  if (layout === 'float') {
    return (
      <div className={`ai-guide ai-guide--float ai-guide--${size}`}>
        {portrait}
        {bubble}
      </div>
    );
  }

  return (
    <div className={`ai-guide ai-guide--stage ai-guide--${size}`}>
      {portrait}
      {bubble}
    </div>
  );
}

export default AiGuide;
