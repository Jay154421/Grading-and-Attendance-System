const VARIANTS = {
  primary:
    "bg-brand text-white hover:bg-brand/90 focus-visible:ring-brand",
  secondary:
    "border border-gray-500 bg-white text-gray-700 hover:bg-gray-100 focus-visible:ring-brand",
  quiet:
    "text-gray-700 hover:bg-gray-100 focus-visible:ring-brand",
};

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...rest
}) {
  return (
    <button type={type} className={`${BASE} ${VARIANTS[variant] || VARIANTS.primary} ${className}`} {...rest}>
      {children}
    </button>
  );
}
