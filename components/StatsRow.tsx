import type { LeaderboardStats } from "@/lib/types";
import { formatNumber, formatRelative } from "@/lib/format";

export function StatsRow({ stats }: { stats: LeaderboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Total posts"
        value={formatNumber(stats.totalPosts)}
        detail={`across the cluster · refreshed ${formatRelative(stats.lastRefreshed)}`}
      />
      <StatCard
        label="Most active tier"
        value={stats.mostActiveTier ? stats.mostActiveTier.label.split(" (")[0] : "—"}
        detail={
          stats.mostActiveTier
            ? `${formatNumber(stats.mostActiveTier.posts)} posts in window`
            : "no data yet"
        }
      />
      <StatCard
        label="Biggest riser"
        value={stats.biggestRiser ? stats.biggestRiser.name : "—"}
        detail={
          stats.biggestRiser
            ? `+${formatNumber(stats.biggestRiser.delta)} posts vs last snapshot`
            : "needs two refreshes"
        }
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="font-code text-[11px] uppercase tracking-wider text-text-tertiary">
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl leading-tight text-text truncate">
        {value}
      </div>
      <div className="mt-1 font-code text-[10.5px] text-text-tertiary truncate">
        {detail}
      </div>
    </div>
  );
}
