const TIER_STYLES: Record<number, { label: string; className: string }> = {
  1: { label: "Anchor", className: "bg-[var(--iris-soft)] text-iris-700" },
  2: { label: "Core", className: "bg-[var(--green-soft)] text-[var(--green-500)]" },
  3: { label: "Community", className: "bg-[var(--amber-soft)] text-[var(--amber-500)]" },
  4: { label: "Rising", className: "bg-gray-100 text-gray-500" },
};

export function TierBadge({ tier }: { tier: number }) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES[4];
  return (
    <span
      className={`font-code text-[10.5px] uppercase tracking-wider px-2 py-0.5 rounded-full ${style.className}`}
    >
      {style.label}
    </span>
  );
}
