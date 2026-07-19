type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export default function BrandLogo({ compact = false, inverse = false, className = "" }: BrandLogoProps) {
  const ink = inverse ? "#ffffff" : "#0D1B2A";

  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="RGNFIX">
      <svg viewBox="0 0 64 64" className="h-full w-auto shrink-0" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="rgnfix-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00B4B0" />
            <stop offset="0.55" stopColor="#0096D6" />
            <stop offset="1" stopColor="#1E2A39" />
          </linearGradient>
        </defs>
        <path d="M8 7h13l11 16L44 7h13L38.5 32 57 57H44L32 41 20 57H7l18.5-25L8 7Z" fill={ink} />
        <path d="M32 23 44 7h13L38.5 32 32 23Z" fill="url(#rgnfix-blue)" />
        <path d="M8 11H4v42h4M4 17h5M4 24h3M4 31h5M4 38h3M4 45h5" fill="none" stroke="#0096D6" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M56 11h4v42h-4M60 17h-5M60 24h-3M60 31h-5M60 38h-3M60 45h-5" fill="none" stroke="#00B4B0" strokeWidth="1.4" strokeLinecap="round" />
        <path d="m24 43 5 7" stroke="#A7B1BD" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {!compact && (
        <span className="min-w-0 leading-none">
          <strong className="block whitespace-nowrap text-[1.15rem] font-black tracking-[-0.035em]" style={{ color: ink }}>
            RGN<span className="brand-fix">FIX</span>
          </strong>
          <small className={`mt-1 hidden whitespace-nowrap text-[6.5px] font-semibold tracking-[0.14em] sm:block ${inverse ? "text-white/70" : "text-muted-foreground"}`}>
            AKILLI ÖLÇÜ VE DEMONTE ÜRÜN PLATFORMU
          </small>
        </span>
      )}
    </div>
  );
}
