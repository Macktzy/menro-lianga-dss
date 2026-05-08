import React from 'react';

export function Modal({ open, title, children, footer, onClose }) {
  if (!open) return null;

  return (
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title ? <div className="ui-modal-title">{title}</div> : null}
        <div className="ui-modal-body">{children}</div>
        {footer ? <div className="ui-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

