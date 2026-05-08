import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

function createId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({ title, message, variant = 'info', durationMs = 3200 } = {}) => {
      const id = createId();
      const toast = { id, title, message, variant };
      setToasts((prev) => [...prev, toast]);

      if (durationMs > 0) {
        const timer = setTimeout(() => dismiss(id), durationMs);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`ui-toast ui-toast-${t.variant}`}
            role="status"
            aria-live="polite"
          >
            <div className="ui-toast-body">
              {t.title ? <div className="ui-toast-title">{t.title}</div> : null}
              {t.message ? <div className="ui-toast-message">{t.message}</div> : null}
            </div>
            <button className="ui-toast-x" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

