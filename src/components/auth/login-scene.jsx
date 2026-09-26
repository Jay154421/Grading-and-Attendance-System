const MARKED_DAYS = new Set([0, 2, 4, 7, 9, 11, 14, 16, 18]);

const ROWS = [
  { width: 132, grade: "A" },
  { width: 158, grade: "B+" },
  { width: 116, grade: "A-" },
  { width: 148, grade: "B" },
];

export default function LoginScene({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 560"
      fill="none"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="66" y="86" width="400" height="360" rx="16" fill="#4338CA" opacity="0.07" />
      <rect
        x="40"
        y="60"
        width="400"
        height="360"
        rx="16"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="2"
      />

      <rect x="68" y="88" width="156" height="18" rx="9" fill="#4338CA" opacity="0.35" />
      <rect x="68" y="116" width="96" height="10" rx="5" fill="#4338CA" opacity="0.18" />
      <path d="M48 142 H432" stroke="#E2E8F0" strokeWidth="2" />
      <rect x="68" y="156" width="64" height="8" rx="4" fill="#94A3B8" opacity="0.6" />
      <rect x="252" y="156" width="34" height="8" rx="4" fill="#94A3B8" opacity="0.6" />
      <rect x="310" y="156" width="48" height="8" rx="4" fill="#94A3B8" opacity="0.6" />

      {ROWS.map((row, i) => {
        const checkY = 193 + i * 56;
        const chipY = 181 + i * 56;
        return (
          <g key={i}>
            <rect x="68" y={checkY - 7} width={row.width} height="14" rx="7" fill="#CBD5E1" />
            <circle cx="268" cy={checkY} r="15" fill="#4338CA" opacity="0.12" />
            <path
              d={`M261 ${checkY} l5 5 l9 -10`}
              stroke="#4338CA"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="306" y={chipY} width="58" height="30" rx="6" fill="#4338CA" opacity="0.12" />
            <text
              x="335"
              y={chipY + 20}
              textAnchor="middle"
              fill="#4338CA"
              fontSize="15"
              fontWeight="700"
              fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
            >
              {row.grade}
            </text>
          </g>
        );
      })}

      <circle cx="428" cy="86" r="26" fill="#4338CA" />
      <path
        d="M417 86 l7 7 l14 -16"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="372"
        y="316"
        width="248"
        height="216"
        rx="14"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      <rect x="392" y="340" width="84" height="14" rx="7" fill="#4338CA" opacity="0.35" />
      <rect x="556" y="340" width="44" height="14" rx="7" fill="#CBD5E1" />
      {Array.from({ length: 28 }, (_, i) => {
        const x = 392 + (i % 7) * 30;
        const y = 372 + Math.floor(i / 7) * 30;
        const marked = MARKED_DAYS.has(i);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width="24"
              height="24"
              rx="5"
              fill={marked ? "#4338CA" : "#F1F5F9"}
            />
            {marked && (
              <path
                d={`M${x + 7} ${y + 12} l4 4 l6.5 -8`}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
