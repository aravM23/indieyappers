import Link from "next/link";
import type { TimeWindow } from "@/lib/types";

const OPTIONS: { value: TimeWindow; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function WindowToggle({ active }: { active: TimeWindow }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-[var(--shadow-xs)]">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={opt.value === "7d" ? "/" : `/?window=${opt.value}`}
          className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-[var(--dur-fast)] ${
            active === opt.value
              ? "bg-gray-900 text-white shadow-[var(--shadow-sm)]"
              : "text-text-secondary hover:bg-[var(--surface-hover-ink)]"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
