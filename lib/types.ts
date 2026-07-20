export interface SeedFounder {
  handle: string;
  name: string;
  product: string;
  tier: number;
  tierLabel: string;
  approxFollowers: number | null;
  notes: string;
  flag: string | null;
}

export interface FounderRow {
  handle: string;
  name: string;
  product: string;
  tier: number;
  tier_label: string;
  approx_followers: number | null;
  notes: string;
  x_user_id: string | null;
  avatar_url: string | null;
  followers: number | null;
  lifetime_tweet_count: number | null;
  profile_updated_at: string | null;
}

export interface SnapshotRow {
  id: number;
  handle: string;
  captured_at: string;
  followers: number | null;
  lifetime_tweet_count: number | null;
  posts_7d_original: number;
  posts_7d_reply: number;
  posts_7d_retweet: number;
  posts_30d_original: number;
  posts_30d_reply: number;
  posts_30d_retweet: number;
}

export type TimeWindow = "7d" | "30d";

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  name: string;
  product: string;
  tier: number;
  tierLabel: string;
  avatarUrl: string | null;
  followers: number | null;
  postsOriginal: number;
  postsReply: number;
  postsRetweet: number;
  postsTotal: number;
  yapScore: number;
  capturedAt: string | null;
}

export interface LeaderboardStats {
  totalPosts: number;
  mostActiveTier: { tier: number; label: string; posts: number } | null;
  biggestRiser: { handle: string; name: string; delta: number } | null;
  lastRefreshed: string | null;
}

/** Originals count full, replies half, retweets a quarter. */
export function yapScore(original: number, reply: number, retweet: number): number {
  return Math.round((original * 1.0 + reply * 0.5 + retweet * 0.25) * 10) / 10;
}
