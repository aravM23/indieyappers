import { getDb } from "./db";
import {
  yapScore,
  type FounderRow,
  type SnapshotRow,
  type LeaderboardEntry,
  type LeaderboardStats,
  type TimeWindow,
} from "./types";

type JoinedRow = FounderRow & Partial<SnapshotRow> & { captured_at?: string };

function latestSnapshotsJoin(): JoinedRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT f.*, s.captured_at, s.followers AS snap_followers,
              s.posts_7d_original, s.posts_7d_reply, s.posts_7d_retweet,
              s.posts_30d_original, s.posts_30d_reply, s.posts_30d_retweet
       FROM founders f
       LEFT JOIN activity_snapshots s ON s.id = (
         SELECT id FROM activity_snapshots
         WHERE handle = f.handle
         ORDER BY captured_at DESC, id DESC
         LIMIT 1
       )`
    )
    .all() as JoinedRow[];
}

export function getLeaderboard(window: TimeWindow): LeaderboardEntry[] {
  const rows = latestSnapshotsJoin();

  const entries = rows.map((r) => {
    const original =
      (window === "7d" ? r.posts_7d_original : r.posts_30d_original) ?? 0;
    const reply = (window === "7d" ? r.posts_7d_reply : r.posts_30d_reply) ?? 0;
    const retweet =
      (window === "7d" ? r.posts_7d_retweet : r.posts_30d_retweet) ?? 0;
    return {
      rank: 0,
      handle: r.handle,
      name: r.name,
      product: r.product,
      tier: r.tier,
      tierLabel: r.tier_label,
      avatarUrl: r.avatar_url,
      followers: r.followers ?? r.approx_followers,
      postsOriginal: original,
      postsReply: reply,
      postsRetweet: retweet,
      postsTotal: original + reply + retweet,
      yapScore: yapScore(original, reply, retweet),
      capturedAt: r.captured_at ?? null,
    };
  });

  entries.sort((a, b) => b.yapScore - a.yapScore || b.postsTotal - a.postsTotal);
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

export function getStats(window: TimeWindow): LeaderboardStats {
  const entries = getLeaderboard(window);
  const totalPosts = entries.reduce((sum, e) => sum + e.postsTotal, 0);

  const tierTotals = new Map<number, { label: string; posts: number }>();
  for (const e of entries) {
    const cur = tierTotals.get(e.tier) ?? { label: e.tierLabel, posts: 0 };
    cur.posts += e.postsTotal;
    tierTotals.set(e.tier, cur);
  }
  let mostActiveTier: LeaderboardStats["mostActiveTier"] = null;
  for (const [tier, { label, posts }] of tierTotals) {
    if (!mostActiveTier || posts > mostActiveTier.posts) {
      mostActiveTier = { tier, label, posts };
    }
  }

  return {
    totalPosts,
    mostActiveTier,
    biggestRiser: getBiggestRiser(window),
    lastRefreshed: entries.find((e) => e.capturedAt)?.capturedAt ?? null,
  };
}

/**
 * Compare each founder's two most recent snapshots (needs 2+ refreshes to
 * produce anything) and return the largest increase in window post volume.
 */
function getBiggestRiser(window: TimeWindow): LeaderboardStats["biggestRiser"] {
  const db = getDb();
  const col = window === "7d" ? "posts_7d" : "posts_30d";
  const rows = db
    .prepare(
      `SELECT f.handle, f.name,
              (s1.${col}_original + s1.${col}_reply + s1.${col}_retweet) -
              (s2.${col}_original + s2.${col}_reply + s2.${col}_retweet) AS delta
       FROM founders f
       JOIN activity_snapshots s1 ON s1.id = (
         SELECT id FROM activity_snapshots WHERE handle = f.handle
         ORDER BY captured_at DESC, id DESC LIMIT 1
       )
       JOIN activity_snapshots s2 ON s2.id = (
         SELECT id FROM activity_snapshots WHERE handle = f.handle
         ORDER BY captured_at DESC, id DESC LIMIT 1 OFFSET 1
       )
       ORDER BY delta DESC
       LIMIT 1`
    )
    .all() as { handle: string; name: string; delta: number }[];

  const top = rows[0];
  if (!top || top.delta <= 0) return null;
  return top;
}
