import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Main letterform color. Defaults to currentColor. */
  color?: string;
  /** Small accent bar color. Defaults to brand gold. */
  accent?: string;
  /** Deprecated — kept for back-compat with older call sites. */
  gold?: string;
  /** Deprecated — kept for back-compat with older call sites. */
  light?: string;
};

/**
 * Pulstract P monogram — two interlocking rounded "P-hook" letterforms
 * meeting at a small accent bar. Uses currentColor for the main mark and
 * a separate accent color for the centre bar. Matches the brand guideline
 * artwork (Pulstract Brand Guideline 2026).
 */
export function PulstractMark({
  className,
  color,
  accent,
  gold,
  light,
}: Props) {
  const mainFill = color ?? gold ?? light ?? "currentColor";
  const accentFill = accent ?? "var(--logo-accent, #CDAB7F)";

  // Single hook shape (top-right "P" curl). Filled path, rounded.
  // The full mark is this hook plus a 180°-rotated copy of itself around (32,32).
  const hook =
    "M18 8 h26 a12 12 0 0 1 12 12 v10 a12 12 0 0 1 -12 12 h-16 v-8 h16 a4 4 0 0 0 4 -4 v-10 a4 4 0 0 0 -4 -4 h-26 z";

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("block", className)}
      aria-hidden="true"
    >
      {/* Top-right hook */}
      <path d={hook} fill={mainFill} />
      {/* Bottom-left hook — same shape rotated 180° around centre */}
      <path d={hook} fill={mainFill} transform="rotate(180 32 32)" />
      {/* Centre accent bar where the two hooks meet */}
      <rect x="28" y="30" width="8" height="4" fill={accentFill} />
    </svg>
  );
}

/** Full lockup: P mark + Pulstract wordmark. */
export function PulstractLockup({
  className,
  stacked = false,
  tagline = false,
}: {
  className?: string;
  stacked?: boolean;
  tagline?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3",
        stacked && "flex-col gap-2",
        className,
      )}
    >
      <PulstractMark className="h-10 w-10" />
      <span className="inline-flex flex-col leading-none">
        <span className="font-display text-2xl font-normal tracking-tight">
          Pulstract
        </span>
        {tagline && (
          <span className="mt-1 font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-primary">
            Fitness Booking App
          </span>
        )}
      </span>
    </span>
  );
}
