import { useId } from "react";

export const inputClass =
  "block min-h-11 w-full rounded-md border border-gray-500 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500";

function describedBy(id, hint, error) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

export function TextField({ id, label, hint, error, required, className = "", ...rest }) {
  const generated = useId();
  const fieldId = id || generated;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={fieldId}
        className={inputClass}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        required={required}
        {...rest}
      />
      {/* Always mounted so a newly added message is announced, not just painted. */}
      <div aria-live="polite">
        {hint && (
          <p id={`${fieldId}-hint`} className="mt-1 text-xs text-gray-600">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="mt-1 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function SelectField({ id, label, hint, error, required, children, className = "", ...rest }) {
  const generated = useId();
  const fieldId = id || generated;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={fieldId}
        className={inputClass}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        required={required}
        {...rest}
      >
        {children}
      </select>
      <div aria-live="polite">
        {hint && (
          <p id={`${fieldId}-hint`} className="mt-1 text-xs text-gray-600">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="mt-1 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function CheckboxGroup({ legend, hint, error, children, className = "" }) {
  const generated = useId();
  const hintId = hint ? `${generated}-hint` : undefined;
  const errorId = error ? `${generated}-error` : undefined;
  return (
    <fieldset
      className={className}
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? "true" : undefined}
    >
      <legend className="mb-2 block text-sm font-medium text-gray-700">{legend}</legend>
      {hint && (
        <p id={hintId} className="mb-2 text-xs text-gray-600">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
