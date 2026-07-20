import type { LeaderboardEntry } from "@/lib/types";
import { formatCompact, formatNumber } from "@/lib/format";
import { Avatar } from "./Avatar";
import { TierBadge } from "./TierBadge";

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-[var(--shadow-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <Th className="w-14 text-center">#</Th>
            <Th>Founder</Th>
            <Th className="hidden md:table-cell">Product</Th>
            <Th className="hidden sm:table-cell text-right">Followers</Th>
            <Th className="hidden lg:table-cell text-right">Original</Th>
            <Th className="hidden lg:table-cell text-right">Replies</Th>
            <Th className="hidden lg:table-cell text-right">RTs</Th>
            <Th className="text-right">Posts</Th>
            <Th className="text-right pr-5">Yap Score</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.handle} className="group relative border-b border-border-subtle last:border-b-0 hover:bg-[var(--surface-hover-ink)] transition-colors duration-[var(--dur-fast)]">
              <td className="py-3 text-center">
                <span
                  className={`font-code text-[12px] tabular-nums ${
                    e.rank <= 3 ? "text-iris-600 font-semibold" : "text-text-tertiary"
                  }`}
                >
                  {e.rank}
                </span>
              </td>
              <td className="py-3">
                <a
                  href={`https://x.com/${e.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 min-w-0 after:absolute after:inset-0"
                >
                  <Avatar name={e.name} url={e.avatarUrl} size={36} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-text leading-tight">
                      {e.name}
                    </span>
                    <span className="font-code text-[11px] text-text-tertiary truncate">
                      @{e.handle}
                    </span>
                  </span>
                </a>
              </td>
              <td className="hidden md:table-cell py-3 pr-4 max-w-[220px]">
                <span className="block truncate text-[13px] text-text-secondary">
                  {e.product}
                </span>
                <TierBadge tier={e.tier} />
              </td>
              <td className="hidden sm:table-cell py-3 text-right font-code text-[12px] text-text-secondary tabular-nums">
                {formatCompact(e.followers)}
              </td>
              <td className="hidden lg:table-cell py-3 text-right font-code text-[12px] text-text-secondary tabular-nums">
                {formatNumber(e.postsOriginal)}
              </td>
              <td className="hidden lg:table-cell py-3 text-right font-code text-[12px] text-text-secondary tabular-nums">
                {formatNumber(e.postsReply)}
              </td>
              <td className="hidden lg:table-cell py-3 text-right font-code text-[12px] text-text-secondary tabular-nums">
                {formatNumber(e.postsRetweet)}
              </td>
              <td className="py-3 text-right font-medium text-text tabular-nums">
                {formatNumber(e.postsTotal)}
              </td>
              <td className="py-3 pr-5 text-right">
                <span className="inline-block rounded-full bg-[var(--iris-faint)] px-2.5 py-0.5 font-code text-[12px] font-medium text-iris-700 tabular-nums">
                  {formatNumber(e.yapScore)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`py-3 px-1 first:pl-0 font-code text-[10.5px] font-normal uppercase tracking-wider text-text-tertiary text-left ${className}`}
    >
      {children}
    </th>
  );
}
