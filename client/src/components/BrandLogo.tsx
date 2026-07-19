type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export default function BrandLogo({ compact = false, inverse = false, className = "" }: BrandLogoProps) {
  const navy = inverse ? "#ffffff" : "#0D1B2A";
  const blue = inverse ? "#ffffff" : "#0096D6";
  const cyan = inverse ? "#ffffff" : "#00B4B0";
  const silver = inverse ? "#dbe6ef" : "#A7B1BD";

  return (
    <div className={`flex items-center ${className}`} aria-label="RGNFIX - Plise Perde Gaziantep">
      <div className="flex h-full items-center gap-2.5">
        <svg viewBox="0 0 82 82" className="h-full w-auto shrink-0" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="rgnfixBlue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={cyan} />
              <stop offset="1" stopColor={blue} />
            </linearGradient>
          </defs>
          <path d="M13 9h17l15 22L62 9h14L52 41l23 32H58L42 51 25 73H9l25-33L13 9Z" fill={navy} />
          <path d="M45 31 62 9h14L52 41l23 32H61L45 51l-7-10 7-10Z" fill="url(#rgnfixBlue)" />
          <path d="M17 18v46M21 24h5M21 31h3M21 38h5M21 45h3M21 52h5M21 59h3" stroke={silver} strokeWidth="2" strokeLinecap="round" />
          <path d="M66 18v46M61 24h5M63 31h3M61 38h5M63 45h3M61 52h5M63 59h3" stroke={blue} strokeWidth="2" strokeLinecap="round" />
          <path d="M29 14 49 43 32 66" fill="none" stroke={inverse ? "#ffffff" : "#f8fafc"} strokeWidth="8" strokeLinecap="square" />
          <path d="m33 56 6 8" stroke={silver} strokeWidth="4" />
        </svg>

        {!compact && (
          <span className="min-w-0 leading-none">
            <strong className="block whitespace-nowrap text-[1.22rem] font-black tracking-[-0.045em]" style={{ color: navy }}>
              RGN<span style={{ color: blue }}>FIX</span>
            </strong>
            <small className={`mt-1 block whitespace-nowrap text-[7px] font-bold tracking-[0.12em] ${inverse ? "text-white/80" : "text-muted-foreground"}`}>
              AKILLI ÖLÇÜ VE DEMONTE ÜRÜN PLATFORMU
            </small>
            <small className={`mt-0.5 block whitespace-nowrap text-[6px] font-semibold tracking-[0.1em] ${inverse ? "text-white/70" : "text-muted-foreground/80"}`}>
              BY PLİSE PERDE GAZİANTEP
            </small>
          </span>
        )}
      </div>
    </div>
  );
}
