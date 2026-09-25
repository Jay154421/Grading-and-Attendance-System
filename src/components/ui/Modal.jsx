import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, description, children, footer, width = "max-w-md" }) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const nodes = () =>
      Array.from(panel?.querySelectorAll(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null
      );
    nodes()[0]?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const list = nodes();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (!panel?.contains(active) || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!panel?.contains(active) || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current && document.contains(openerRef.current)) {
        openerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-gray-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[85vh] w-full ${width} flex-col overflow-hidden rounded-xl bg-white shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
