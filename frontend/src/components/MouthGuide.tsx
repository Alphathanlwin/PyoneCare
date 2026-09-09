import type { MouthGuideShape } from '../data/captureAngles';

interface MouthGuideProps {
  shape: MouthGuideShape;
}

// SVG positioning outline for the guided camera capture — lozenge for the
// front-bite shot, open arcs for the upper/lower arch shots.
function MouthGuide({ shape }: MouthGuideProps) {
  const path =
    shape === 'upper'
      ? 'M12 88 C12 26 66 4 110 4 C154 4 208 26 208 88'
      : shape === 'lower'
      ? 'M12 4 C12 66 66 88 110 88 C154 88 208 66 208 4'
      : 'M6 44 C36 8 184 8 214 44 C184 104 36 104 6 44 Z';

  return (
    <svg className="live-mouth-guide" viewBox="0 0 220 108" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={path} stroke="#0ea5e9" strokeWidth="2.5" strokeLinejoin="round" />
      {([
        [8, 8, 0, 0],
        [198, 8, 1, 0],
        [8, 84, 0, 1],
        [198, 84, 1, 1],
      ] as const).map(([x, y, fx, fy], i) => (
        <path
          key={i}
          d="M0 16 L0 4 Q0 0 4 0 L16 0"
          stroke="#f1f5f9cc"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`translate(${x} ${y}) scale(${fx ? -1 : 1} ${fy ? -1 : 1})`}
        />
      ))}
    </svg>
  );
}

export default MouthGuide;
