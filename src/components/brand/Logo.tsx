// Brand logo. `mark` is the standalone SVG glyph; `Logo` pairs it with the
// wordmark. Pure SVG (no external assets) so it stays crisp at any size and
// works under the app's strict asset policy.

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="warm sitter">
      <defs>
        <linearGradient id="ws-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="0.55" stopColor="#0284c7" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="ws-mark-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Rounded badge */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#ws-mark-g)" />
      <rect x="2" y="2" width="44" height="44" rx="14" fill="none" stroke="white" strokeOpacity="0.25" />
      {/* Warm sun */}
      <circle cx="24" cy="19" r="6.5" fill="url(#ws-mark-sun)" />
      {/* Protective heart / hands cradle */}
      <path
        d="M14 27c0-1 3-2 4.6-.4 1 1 1 1 1.4 1.4.4-.4.4-.4 1.4-1.4C24 25 26 26 26 27c0 2.4-4 5-6 6.2C18 32 14 29.4 14 27Z"
        fill="#ffffff"
        opacity="0.95"
      />
      <path
        d="M22 30c0-1.4 4-2.6 6-.6 1.2 1.2 1.2 1.2 1.8 1.8.6-.6.6-.6 1.8-1.8 2-2 6-.8 6 .6 0 3-5 6.4-7.8 8-2.8-1.6-7.8-5-7.8-8Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  markClass = "h-9 w-9",
}: {
  className?: string;
  markClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClass} />
      <span className="text-lg font-extrabold tracking-tight text-ink-900">
        warm<span className="ws-gradient-text">sitter</span>
      </span>
    </span>
  );
}
