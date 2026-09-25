import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { subscribe, dismissToast, getToasts } from "./toastApi";

const TONE = {
  success: {
    className: "border-green-200 bg-green-50 text-green-800",
    icon: CheckCircle2,
    label: "Success",
  },
  error: {
    className: "border-red-200 bg-red-50 text-red-800",
    icon: XCircle,
    label: "Error",
  },
  warning: {
    className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    icon: AlertTriangle,
    label: "Warning",
  },
  info: {
    className: "border-gray-200 bg-white text-gray-700",
    icon: Info,
    label: "Notice",
  },
};

function ToastItem({ item, onDismiss }) {
  const tone = TONE[item.type] || TONE.info;
  const Glyph = tone.icon;
  return (
    <div
      className={`animate-toast-in pointer-events-auto flex min-h-11 w-full items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${tone.className}`}
    >
      <Glyph className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 py-0.5 text-sm font-medium">{item.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dismiss ${tone.label.toLowerCase()} message`}
        className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const [list, setList] = useState(getToasts);

  useEffect(() => subscribe(setList), []);

  const assertive = list.filter((item) => item.type === "error" || item.type === "warning");
  const polite = list.filter((item) => item.type === "success" || item.type === "info");

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col items-end gap-2">
      <div className="flex w-full flex-col items-end gap-2" role="alert" aria-live="assertive">
        {assertive.map((item) => (
          <ToastItem key={item.id} item={item} onDismiss={() => dismissToast(item.id)} />
        ))}
      </div>
      <div className="flex w-full flex-col items-end gap-2" role="status" aria-live="polite">
        {polite.map((item) => (
          <ToastItem key={item.id} item={item} onDismiss={() => dismissToast(item.id)} />
        ))}
      </div>
    </div>
  );
}
