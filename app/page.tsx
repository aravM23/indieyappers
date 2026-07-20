import { getLeaderboard, getStats } from "@/lib/leaderboard";
import type { TimeWindow } from "@/lib/types";
import { WindowToggle } from "@/components/WindowToggle";
import { StatsRow } from "@/components/StatsRow";
import { TopCards } from "@/components/TopCards";
import { LeaderboardTable } from "@/components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const params = await searchParams;
  const window: TimeWindow = params.window === "30d" ? "30d" : "7d";
  const entries = getLeaderboard(window);
  const stats = getStats(window);
  const hasData = entries.some((e) => e.capturedAt);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
      <header className="mb-8">
        <div className="stanley-label">Stanley · Labs</div>
        <h1 className="mt-1.5 font-display text-4xl leading-tight text-text">
          Yapper
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          The indie founder leaderboard — ranking {entries.length} builders by
          who&apos;s been yapping the most on X. Originals count full, replies
          half, retweets a quarter.
        </p>
      </header>

      {!hasData && (
        <div className="mb-6 rounded-[var(--radius-md)] border border-border bg-[var(--amber-soft)] px-4 py-3 text-[13px] text-text-secondary">
          No activity data yet. Run{" "}
          <code className="font-code text-[12px]">npm run refresh</code> with an{" "}
          <code className="font-code text-[12px]">X_BEARER_TOKEN</code> in{" "}
          <code className="font-code text-[12px]">.env.local</code>, or{" "}
          <code className="font-code text-[12px]">npm run mock</code> for demo
          data.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <WindowToggle active={window} />
      </div>

      <div className="flex flex-col gap-6">
        <StatsRow stats={stats} />
        <TopCards entries={entries} />
        <section>
          <div className="stanley-label mb-3">Full leaderboard</div>
          <LeaderboardTable entries={entries} />
        </section>
      </div>

      <footer className="mt-10 border-t border-border-subtle pt-5 font-code text-[10.5px] text-text-tertiary">
        data: X API v2 · seed list: 101 indie tech accounts · yap score =
        originals + 0.5 x replies + 0.25 x retweets
      </footer>
    </main>
  );
}
