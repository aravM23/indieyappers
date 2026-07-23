// GrayPass passive monitoring (time-boxed research data collection).
//
// The site embeds the GrayPass drop-in SDK in monitor mode: after visitor
// consent it streams anonymized interaction-pattern frames (typing rhythm,
// mouse movement, scrolling — never content) to the GrayPass API to improve
// its behavioral models. Collection is hard-stopped at GRAYPASS_COLLECT_UNTIL
// in three places: this config, the token route, and the SDK's data-until.

export interface GraypassConfig {
  apiBase: string;
  publishableKey: string;
  secretKey: string;
  collectUntil: Date;
}

export function graypassConfig(): GraypassConfig | null {
  const publishableKey = process.env.GRAYPASS_PUBLISHABLE_KEY;
  const secretKey = process.env.GRAYPASS_SECRET_KEY;
  const untilRaw = process.env.GRAYPASS_COLLECT_UNTIL;
  if (!publishableKey || !secretKey || !untilRaw) return null;

  const collectUntil = new Date(untilRaw);
  if (Number.isNaN(collectUntil.getTime())) return null;

  return {
    apiBase: (process.env.GRAYPASS_API_BASE ?? "https://api.graypass.org").replace(/\/+$/, ""),
    publishableKey,
    secretKey,
    collectUntil,
  };
}

export function collectionOpen(config: GraypassConfig, now = new Date()): boolean {
  return now < config.collectUntil;
}
