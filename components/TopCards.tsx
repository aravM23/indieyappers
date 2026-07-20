import type { LeaderboardEntry } from "@/lib/types";
import { formatCompact, formatNumber } from "@/lib/format";
import { Avatar } from "./Avatar";
import { TierBadge } from "./TierBadge";

const MEDALS = ["#1", "#2", "#3"];

export function TopCards({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {entries.slice(0, 3).map((e, i) => (
        <a
          key={e.handle}
          href={`https://x.com/${e.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`group relative flex flex-col gap-4 rounded-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-card)] transition-transform duration-[var(--dur-base)] hover:-translate-y-px ${
            i === 0 ? "ring-1 ring-[var(--iris-ring)]" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-code text-[11px] uppercase tracking-wider ${
                i === 0 ? "text-iris-600" : "text-text-tertiary"
              }`}
            >
              {MEDALS[i]} yapper
            </span>
            <TierBadge tier={e.tier} />
          </div>
          <div className="flex items-center gap-3.5">
            <Avatar name={e.name} url={e.avatarUrl} size={52} />
            <div className="min-w-0">
              <div className="truncate font-medium text-text">{e.name}</div>
              <div className="font-code text-[11px] text-text-tertiary truncate">
                @{e.handle}
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-border-subtle pt-4">
            <div>
              <div className="font-display text-3xl leading-tight text-text tabular-nums">
                {formatNumber(e.yapScore)}
              </div>
              <div className="font-code text-[10.5px] uppercase tracking-wider text-text-tertiary mt-0.5">
                yap score
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text tabular-nums">
                {formatNumber(e.postsTotal)}
              </div>
              <div className="font-code text-[10.5px] text-text-tertiary">
                posts · {formatCompact(e.followers)} followers
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
