import React, { useCallback, useMemo, useState } from 'react';
import { Modal } from './Modal.jsx';

export function useConfirm() {
  const [state, setState] = useState({ open: false });

  const confirm = useCallback(
    ({ title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) =>
      new Promise((resolve) => {
        setState({
          open: true,
          title,
          message,
          confirmText,
          cancelText,
          danger,
          resolve,
        });
      }),
    []
  );

  const close = useCallback((result) => {
    setState((prev) => {
      if (prev?.resolve) prev.resolve(result);
      return { open: false };
    });
  }, []);

  const ConfirmModal = useMemo(() => {
    return function ConfirmModalInner() {
      return (
        <Modal
          open={!!state.open}
          title={state.title}
          onClose={() => close(false)}
          footer={
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="ui-btn ui-btn-ghost" onClick={() => close(false)}>
                {state.cancelText || 'Cancel'}
              </button>
              <button
                className="ui-btn ui-btn-primary"
                style={state.danger ? { background: 'linear-gradient(135deg, #ff4757, #ff6b6b)' } : undefined}
                onClick={() => close(true)}
              >
                {state.confirmText || 'Confirm'}
              </button>
            </div>
          }
        >
          <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.4 }}>
            {state.message || 'Are you sure?'}
          </div>
        </Modal>
      );
    };
  }, [close, state]);

  return { confirm, ConfirmModal };
}

