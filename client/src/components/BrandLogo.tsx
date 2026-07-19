type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export default function BrandLogo({ compact = false, inverse = false, className = "" }: BrandLogoProps) {
  const ink = inverse ? "#ffffff" : "#111111";

  return (
    <div className={`flex items-center ${className}`} aria-label="Plise Perde Gaziantep">
      <div className="flex h-full items-center gap-2.5">
        <svg viewBox="0 0 70 54" className="h-full w-auto shrink-0" role="img" aria-hidden="true">
          <rect x="2" y="2" width="66" height="50" rx="2" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M10 12h18v30H10zM14 16h10v22H14z" fill={ink} fillRule="evenodd" />
          <path d="M34 14h24M34 23h24M34 32h24M34 41h24" stroke={ink} strokeWidth="3" strokeLinecap="square" />
          <rect x="18" y="21" width="23" height="12" rx="1" fill={inverse ? "#111111" : "#ffffff"} stroke={ink} strokeWidth="1.5" />
          <text x="29.5" y="29.5" textAnchor="middle" fontSize="7" fontWeight="800" fill={ink}>PERDE</text>
        </svg>

        {!compact && (
          <span className="min-w-0 leading-none" style={{ color: ink }}>
            <strong className="block whitespace-nowrap text-[1.02rem] font-black tracking-[-0.04em]">PLİSE PERDE</strong>
            <small className={`mt-1 block whitespace-nowrap text-[8px] font-bold tracking-[0.22em] ${inverse ? "text-white/80" : "text-muted-foreground"}`}>GAZİANTEP</small>
          </span>
        )}
      </div>
    </div>
  );
}
