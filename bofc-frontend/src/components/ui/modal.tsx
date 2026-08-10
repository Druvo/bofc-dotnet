import React, { useEffect } from "react";
import ReactDOM from "react-dom";

/**
 * TailAdmin Free v2.3.0 modal (src/partials/calendar-event-modal.html shell) -
 * plain controlled overlay, no Radix dependency, so it drops in wherever the
 * old antd <Modal open/onCancel> was used.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "max-w-[600px]",
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portaled straight to <body> - rendering in place would make this fixed
  // overlay a descendant of whatever called it, and any ancestor with an
  // active `transform` (e.g. a card's hover:-translate-y lift) becomes the
  // containing block for `position: fixed`, trapping the modal inside that
  // ancestor's box instead of the viewport.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-5">
      <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[2px] dark:bg-[var(--color-paper-3)]/50" onClick={onClose} />
      <div className={`no-scrollbar relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-[var(--color-paper-3)] lg:p-8 ${className}`}>
        <button
          onClick={onClose}
          type="button"
          className="absolute right-5 top-5 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-[var(--color-paper-2)] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.04 16.54a.75.75 0 0 0 1.06 1.06L12 12.7l4.9 4.9a.75.75 0 1 0 1.06-1.06L13.06 11.6l4.9-4.9a.75.75 0 1 0-1.06-1.06L12 10.55l-4.9-4.9a.75.75 0 1 0-1.06 1.06l4.9 4.9-4.9 4.93Z"
              fill="currentColor"
            />
          </svg>
        </button>
        {title && <h4 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white/90">{title}</h4>}
        {children}
        {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
