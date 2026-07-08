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

  // Bold rounded P letterform with a hollow bowl (even-odd fill).
  // Second sub-path is the inner counter, cut out to create the bowl hole.
  const pShape =
    "M12 8 h28 a16 16 0 0 1 0 32 h-16 v16 h-12 z " +
    "M24 18 v12 h16 a6 6 0 0 0 0 -12 z";

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("block", className)}
      aria-hidden="true"
    >
      <path d={pShape} fill={mainFill} fillRule="evenodd" />
      {/* Small brand accent bar sitting across the bowl-to-stem junction */}
      <rect x="20" y="27" width="14" height="4" rx="1" fill={accentFill} />
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
