export function GravenavMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <span aria-label="GRAVENAV" className="inline-flex items-center gap-3" translate="no">
      <svg
        aria-hidden="true"
        className="shrink-0"
        fill="none"
        height="34"
        viewBox="0 0 34 34"
        width="34"
      >
        <rect fill={inverse ? "#FFFDF8" : "#173F2A"} height="34" rx="10" width="34" />
        <path
          d="M9 25c1.2-6.9 4.4-12.4 9.4-16.5"
          stroke={inverse ? "#A8BEA8" : "#A8BEA8"}
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M21.4 8.4c3.3.4 5.2 2.3 5.6 5.6-3.3-.4-5.2-2.3-5.6-5.6Z"
          fill={inverse ? "#2D6345" : "#FFFDF8"}
        />
        <circle cx="10" cy="25" fill={inverse ? "#2D6345" : "#FFFDF8"} r="2.5" />
      </svg>
      <span className="leading-none">
        <span className="block text-[1.02rem] font-bold tracking-[0.08em]">GRAVENAV</span>
        {!compact ? <span className={`mt-1 block text-[0.68rem] tracking-[0.025em] ${inverse ? "text-white/65" : "text-muted"}`}>Dignified navigation</span> : null}
      </span>
    </span>
  );
}
