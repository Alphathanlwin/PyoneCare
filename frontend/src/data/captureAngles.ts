// Shared by GuidedCapture (live camera + fallback upload) and the analyzing
// screen's thumbnails, so the three angles stay in lockstep everywhere.

export type CaptureAngleId = 'front' | 'upper' | 'lower';
export type MouthGuideShape = 'bite' | 'upper' | 'lower';

export interface CaptureAngle {
  id: CaptureAngleId;
  label: string;
  hint: string;
  caption: string;
  shape: MouthGuideShape;
}

export const CAPTURE_ANGLES: CaptureAngle[] = [
  {
    id: 'front',
    label: 'Front bite',
    hint: 'Bite together gently and fill the outline',
    caption: 'Smile wide so I can see your front teeth.',
    shape: 'bite',
  },
  {
    id: 'upper',
    label: 'Upper arch',
    hint: 'Open wide and fill the arch outline',
    caption: 'Tilt your head back and open wide — I need the upper arch.',
    shape: 'upper',
  },
  {
    id: 'lower',
    label: 'Lower arch',
    hint: 'Relax your tongue and fill the arch outline',
    caption: 'Last one — look down and open, so I can see the lower teeth.',
    shape: 'lower',
  },
];

export type PhotoMap = Record<CaptureAngleId, string | null>;

export const initialPhotos: PhotoMap = Object.fromEntries(
  CAPTURE_ANGLES.map((a) => [a.id, null]),
) as PhotoMap;
