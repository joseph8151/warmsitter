// Premium hero illustration — a warm, abstract "caring hands" scene rendered
// entirely in SVG (brand gradients, soft depth) with a couple of floating
// glass product cards to signal trust. No external image assets.

export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 460 420" className="w-full drop-shadow-[0_30px_60px_rgba(2,132,199,0.25)]" role="img" aria-label="따뜻한 돌봄 일러스트">
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#e0f2fe" />
            <stop offset="1" stopColor="#f0f9ff" />
          </linearGradient>
          <linearGradient id="hero-blob" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7dd3fc" />
            <stop offset="1" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="hero-sun" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="hero-adult" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0ea5e9" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="hero-child" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="hero-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0284c7" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Rounded canvas */}
        <rect x="10" y="14" width="440" height="392" rx="40" fill="url(#hero-sky)" />

        {/* Sun */}
        <circle cx="360" cy="96" r="34" fill="url(#hero-sun)" />
        <g stroke="#f59e0b" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round">
          <path d="M360 44v-14" />
          <path d="M405 96h14" />
          <path d="M392 64l10-10" />
        </g>

        {/* Rolling hills */}
        <path d="M10 300c70-40 150-40 230 0s150 40 210 0v106H10z" fill="#bae6fd" opacity="0.7" />
        <path d="M10 330c90-34 160-30 250 4s130 26 190-2v74H10z" fill="url(#hero-blob)" opacity="0.9" />

        {/* Adult figure */}
        <g filter="url(#hero-soft)">
          <path d="M150 356c0-46 24-78 58-78s58 32 58 78z" fill="url(#hero-adult)" />
          <circle cx="208" cy="250" r="30" fill="url(#hero-adult)" />
          <circle cx="208" cy="250" r="30" fill="#ffffff" opacity="0.12" />
        </g>

        {/* Child figure cradled at the side */}
        <g filter="url(#hero-soft)">
          <path d="M236 360c0-30 15-50 37-50s37 20 37 50z" fill="url(#hero-child)" />
          <circle cx="273" cy="292" r="20" fill="url(#hero-child)" />
          <circle cx="273" cy="292" r="20" fill="#ffffff" opacity="0.15" />
        </g>

        {/* Caring arm arc linking them */}
        <path
          d="M188 300c18 26 46 30 78 18"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.6"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Little heart above */}
        <path
          d="M262 214c0-6 8-9 12-3 4-6 12-3 12 3 0 8-12 15-12 15s-12-7-12-15z"
          fill="#f472b6"
        />
      </svg>

      {/* Floating glass trust cards */}
      <div className="absolute -left-3 top-16 hidden animate-float rounded-2xl ws-glass px-4 py-3 shadow-lift sm:block">
        <div className="flex items-center gap-2">
          <span className="text-amber-500">★</span>
          <div>
            <p className="text-sm font-extrabold leading-none text-ink-900">4.9 / 5.0</p>
            <p className="mt-0.5 text-[11px] text-slate-500">평균 만족도</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 bottom-10 hidden animate-float-slow rounded-2xl ws-glass px-4 py-3 shadow-lift sm:block">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-sm text-white">✓</span>
          <div>
            <p className="text-sm font-extrabold leading-none text-ink-900">신원 확인 완료</p>
            <p className="mt-0.5 text-[11px] text-slate-500">안심하고 맡기세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
