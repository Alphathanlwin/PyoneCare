import { useEffect, useState } from 'react';

// Dr. Ava is a static illustrated portrait, so "talking" is faked as a 3-frame
// cycle (mouth-shape indicator dots + speaking ring) rather than real lip sync.
// Returns the current frame index (0-2) while speaking, 0 at rest.
export default function useTalkingMouth(isSpeaking: boolean, frameMs = 140): number {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isSpeaking) return undefined;

    const id = setInterval(() => {
      setFrame((f) => (f + 1) % 3);
    }, frameMs);

    return () => clearInterval(id);
  }, [isSpeaking, frameMs]);

  return isSpeaking ? frame : 0;
}
