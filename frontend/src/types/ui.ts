// UI-local types shared across components.

export type Theme = 'light' | 'dark';

export type ToastVariant = 'error' | 'success';

export interface Toast {
  message: string;
  variant: ToastVariant;
}

// A chat message as rendered in the result-page explainer chat (ChatPanel).
export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export type AiGuideState =
  | 'idle'
  | 'look_here'
  | 'great_job'
  | 'processing'
  | 'reveal'
  | 'sorry';
