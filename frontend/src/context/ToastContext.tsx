/* Provider component and its hook are intentionally co-located. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Toast, ToastVariant } from '../types/ui';

interface ToastContextValue {
  toast: Toast | null;
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const value = useMemo<ToastContextValue>(() => {
    const showToast = (message: string, variant: ToastVariant = 'error') => {
      setToast({ message, variant });
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setToast(null), 4000);
    };
    return { toast, showToast };
  }, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`toast ${toast.variant === 'success' ? 'toast-success' : 'toast-error'}`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
