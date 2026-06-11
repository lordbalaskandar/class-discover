import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Stroke + diamond color. Defaults to currentColor for left + diamond, white for right. */
  gold?: string;
  light?: string;
  strokeWidth?: number;
};

/**
 * Pulsatract mark — two outward-facing triangles meeting at a small
 * rotated square ("two forces · one centre"). Left triangle = gold,
 * right triangle = light/ink, centre diamond = gold filled.
 */
export function PulsatractMark({
  className,
  gold = "hsl(43 55% 54%)",
  light = "currentColor",
  strokeWidth = 1.25,
}: Props) {
  // viewBox 64x32, centre at (32,16). Diamond half-size = 3.2.
  // Triangles: left tip at x=28.8, right tip at x=35.2.
  return (
    <svg
      viewBox="0 0 64 32"
      className={cn("block", className)}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Left triangle (gold outline, tip pointing right toward diamond) */}
      <polygon
        points="4,4 4,28 28.8,16"
        stroke={gold}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Right triangle (light outline, tip pointing left toward diamond) */}
      <polygon
        points="60,4 60,28 35.2,16"
        stroke={light}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Centre diamond (filled gold) */}
      <rect
        x="28.8"
        y="12.8"
        width="6.4"
        height="6.4"
        transform="rotate(45 32 16)"
        fill={gold}
      />
    </svg>
  );
}

/** Full lockup: mark + wordmark with the "T" highlighted in gold. */
export function PulsatractLockup({
  className,
  stacked = false,
}: {
  className?: string;
  stacked?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3",
        stacked && "flex-col gap-2",
        className,
      )}
    >
      <PulsatractMark className="h-6 w-12" />
      <span className="font-display text-lg tracking-[0.18em] uppercase leading-none">
        pulsa<span style={{ color: "hsl(43 55% 54%)" }}>t</span>ract
      </span>
    </span>
  );
}
