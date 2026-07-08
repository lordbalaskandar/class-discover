import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Optional color override. Defaults to currentColor so parent text color drives the mark. */
  color?: string;
  /** Deprecated — kept for back-compat with older call sites. */
  gold?: string;
  /** Deprecated — kept for back-compat with older call sites. */
  light?: string;
};

/**
 * Pulstract P monogram — the brand letterform rendered in Basis Grotesque
 * Bold. Uses `currentColor` so it inherits the surrounding text color
 * (ink on light backgrounds, gold on dark). Pass `color` to force a shade.
 */
export function PulstractMark({ className, color, gold, light }: Props) {
  const fill = color ?? gold ?? light ?? "currentColor";
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("block", className)}
      aria-hidden="true"
    >
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontFamily='"Basis Grotesque Pro", ui-sans-serif, system-ui, sans-serif'
        fontWeight={900}
        fontSize="64"
        fill={fill}
        style={{ letterSpacing: "-0.04em" }}
      >
        P
      </text>
    </svg>
  );
}

/** Full lockup: P mark + Pulstract wordmark with the "t" highlighted in gold. */
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
      <PulstractMark className="h-8 w-8" />
      <span className="font-display text-lg font-bold tracking-tight leading-none">
        Puls<span className="text-primary">t</span>ract
      </span>
    </span>
  );
}
