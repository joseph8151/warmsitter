// Deterministic SVG avatar used when a sitter has no photo. The gradient is
// derived from the name so each person gets a stable, distinct — but always
// on-brand — swatch. Pure SVG, no network image.

const PALETTES: [string, string][] = [
  ["#38bdf8", "#0284c7"],
  ["#0ea5e9", "#0369a1"],
  ["#22d3ee", "#0891b2"],
  ["#818cf8", "#4f46e5"],
  ["#fbbf24", "#f59e0b"],
  ["#34d399", "#059669"],
  ["#f472b6", "#db2777"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({
  name,
  className = "h-12 w-12",
}: {
  name: string;
  className?: string;
}) {
  const [a, b] = PALETTES[hash(name) % PALETTES.length];
  const id = `av-${hash(name).toString(36)}`;
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={name}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="24" fill={`url(#${id})`} />
      <text
        x="24"
        y="25"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#ffffff"
        fillOpacity="0.95"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {initial}
      </text>
    </svg>
  );
}
