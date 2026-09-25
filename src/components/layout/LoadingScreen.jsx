export default function LoadingScreen({ label = "Loading" }) {
  return (
    <div
      className="flex h-screen items-center justify-center bg-gray-50"
      role="status"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
