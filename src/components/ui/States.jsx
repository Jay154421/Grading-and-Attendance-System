import { AlertTriangle, Inbox } from "lucide-react";

export function LoadingState({ label = "Loading data" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10" role="status">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-brand"
        aria-hidden="true"
      />
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  const Icon = icon || Inbox;
  return (
    <div className="py-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-gray-600" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Could not load this data", message, onRetry, retryLabel = "Try again" }) {
  return (
    <div className="py-10 text-center" role="alert">
      <AlertTriangle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      {message && <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-gray-500 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
