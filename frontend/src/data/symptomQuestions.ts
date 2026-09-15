// Single source of truth for the symptom checklist — shared by the static
// 4-step questionnaire (NewAssessmentPage) and the voice-guided live
// screening flow (SymptomVoiceStep), so both produce the same symptoms{}
// payload shape and never drift out of sync.

import type { SymptomMap } from '../types/api';

export interface SymptomQuestion {
  key: string;
  label: string;
  hint: string;
  question: string;
}

export interface SymptomStep {
  id: number;
  label: string;
  title: string;
  description: string;
  symptoms: SymptomQuestion[];
}

export const SYMPTOM_STEPS: SymptomStep[] = [
  {
    id: 1,
    label: 'Pain & Sensitivity',
    title: 'Pain & Sensitivity',
    description: "Let us know about any pain or sensitivity you've been experiencing.",
    symptoms: [
      {
        key: 'cold_sensitivity',
        label: 'Cold sensitivity',
        hint: 'Pain when drinking cold liquids',
        question: 'Do you feel pain when drinking something cold?',
      },
      {
        key: 'hot_sensitivity',
        label: 'Hot sensitivity',
        hint: 'Pain when drinking hot liquids',
        question: 'Do you feel pain when drinking something hot?',
      },
      {
        key: 'pressure_pain',
        label: 'Pain when biting',
        hint: 'Pain when biting or chewing',
        question: 'Does it hurt when you bite or chew?',
      },
      {
        key: 'spontaneous_pain',
        label: 'Spontaneous pain',
        hint: 'Pain without any trigger',
        question: 'Do you ever get tooth pain out of nowhere, without any trigger?',
      },
    ],
  },
  {
    id: 2,
    label: 'Gum & Appearance',
    title: 'Gum & Appearance',
    description: 'Tell us about your gums and any visible spots, patches or discoloration you have noticed.',
    symptoms: [
      {
        key: 'bleeding_gums',
        label: 'Bleeding gums',
        hint: 'Slight bleeding when brushing',
        question: 'Do your gums bleed when you brush?',
      },
      {
        key: 'swollen_gums',
        label: 'Swollen gums',
        hint: 'Puffy or tender gum tissue',
        question: 'Are your gums puffy or tender?',
      },
      {
        key: 'receding_gums',
        label: 'Receding gums',
        hint: 'Gums pulling away from teeth',
        question: "Do your gums look like they're pulling away from your teeth?",
      },
      {
        key: 'black_spot',
        label: 'Black or brown spot',
        hint: 'Visible dark spot on a tooth',
        question: 'Have you noticed any black or brown spots on a tooth?',
      },
      {
        key: 'white_spot',
        label: 'White spot or patch',
        hint: 'Chalky white area on enamel',
        question: 'Any chalky white spots or patches on your teeth?',
      },
      {
        key: 'yellow_staining',
        label: 'Yellow staining',
        hint: 'Surface discoloration',
        question: 'Have you noticed yellow staining on your teeth?',
      },
    ],
  },
  {
    id: 3,
    label: 'Mouth & Habits',
    title: 'Mouth & Habits',
    description: 'Tell us about your breath, any sores, and how your teeth feel.',
    symptoms: [
      {
        key: 'bad_breath',
        label: 'Bad breath',
        hint: 'Persistent bad breath',
        question: 'Have you noticed persistent bad breath?',
      },
      {
        key: 'dry_mouth',
        label: 'Dry mouth',
        hint: 'Mouth feels dry most of the time',
        question: 'Does your mouth feel dry most of the time?',
      },
      {
        key: 'mouth_ulcer',
        label: 'Mouth ulcer',
        hint: 'Sore lesion inside mouth',
        question: 'Do you have any sores inside your mouth?',
      },
      {
        key: 'burning_sensation',
        label: 'Burning sensation',
        hint: 'Burning feeling in mouth',
        question: 'Do you ever feel a burning sensation in your mouth?',
      },
      {
        key: 'loose_tooth',
        label: 'Loose tooth',
        hint: 'Tooth feels loose',
        question: 'Does any tooth feel loose?',
      },
      {
        key: 'broken_tooth',
        label: 'Broken tooth',
        hint: 'Visible crack or broken piece',
        question: 'Do you have a visibly cracked or broken tooth?',
      },
    ],
  },
  {
    id: 4,
    label: 'Hygiene & Photo',
    title: 'Hygiene & Photo',
    description: 'Tell us about your daily hygiene habits. Photo upload is optional.',
    symptoms: [
      {
        key: 'brushes_twice_daily',
        label: 'Brushes twice daily',
        hint: 'Brushes at least twice per day',
        question: 'Do you brush your teeth at least twice a day?',
      },
      {
        key: 'uses_floss',
        label: 'Uses floss',
        hint: 'Uses dental floss regularly',
        question: 'Do you floss regularly?',
      },
      {
        key: 'sugary_diet',
        label: 'Sugary diet',
        hint: 'High sugar intake in daily diet',
        question: 'Would you say you eat a lot of sugary food?',
      },
      {
        key: 'acid_exposure',
        label: 'Acid exposure',
        hint: 'Frequent consumption of acidic drinks',
        question: 'Do you drink acidic beverages often, like soda or citrus juice?',
      },
    ],
  },
];

export const SYMPTOM_QUESTIONS: SymptomQuestion[] = SYMPTOM_STEPS.flatMap((step) => step.symptoms);

export const initialSymptoms: SymptomMap = Object.fromEntries(
  SYMPTOM_QUESTIONS.map((s) => [s.key, false]),
);
