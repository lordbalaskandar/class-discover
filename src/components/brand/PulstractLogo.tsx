import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Stroke + diamond color. Defaults to currentColor for left + diamond, white for right. */
  gold?: string;
  light?: string;
  strokeWidth?: number;
};

/**
 * Pulstract mark — two outward-facing triangles meeting at a small
 * rotated square ("two forces · one centre"). Left triangle = gold,
 * right triangle = light/ink, centre diamond = gold filled.
 */
export function PulstractMark({
  className,
  gold = "hsl(43 55% 54%)",
  light = "currentColor",
  strokeWidth = 1.6,
}: Props) {
  // viewBox 64x32, centre at (32,16). Diamond half-size = 3.2.
  // Triangles stop well short of the diamond; a thin connector bridges tip → diamond.
  const leftTriTip = 23;          // x where left triangle's right vertex sits
  const rightTriTip = 41;         // x where right triangle's left vertex sits
  const diamondLeft = 28.8;       // diamond's left point
  const diamondRight = 35.2;      // diamond's right point
  return (
    <svg
      viewBox="0 0 64 32"
      className={cn("block", className)}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Left triangle (gold outline, tip pointing right, stops short of diamond) */}
      <polygon
        points={`4,4 4,28 ${leftTriTip},16`}
        stroke={gold}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Connector: left triangle tip → diamond left point */}
      <line
        x1={leftTriTip}
        y1={16}
        x2={diamondLeft}
        y2={16}
        stroke={gold}
        strokeWidth={strokeWidth}
      />
      {/* Right triangle (light outline, tip pointing left, stops short of diamond) */}
      <polygon
        points={`60,4 60,28 ${rightTriTip},16`}
        stroke={light}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Connector: diamond right point → right triangle tip */}
      <line
        x1={diamondRight}
        y1={16}
        x2={rightTriTip}
        y2={16}
        stroke={light}
        strokeWidth={strokeWidth}
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
export function PulstractLockup({
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
      <PulstractMark className="h-6 w-12" />
      <span className="font-display text-lg tracking-[0.18em] uppercase leading-none">
        puls<span style={{ color: "hsl(43 55% 54%)" }}>t</span>ract
      </span>
    </span>
  );
}
