const VARIANTS = {
  primary:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  secondary:
    "border border-gray-500 bg-white text-gray-700 hover:bg-gray-100 focus-visible:ring-red-500",
  quiet:
    "text-gray-700 hover:bg-gray-100 focus-visible:ring-red-500",
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
