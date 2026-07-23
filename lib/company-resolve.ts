/**
 * Figure out a member's company from their X profile: the website link on
 * their profile first, then accounts they @mention in their bio (people often
 * put their company's X handle there). Domains resolve to a brand profile
 * (name, logo, description) via the context.dev Brand API.
 */
import { getUsersByHandles, type XUser } from "./x-api";

export interface ResolvedCompany {
  name: string;
  domain: string;
  logo: string | null;
  description: string | null;
}

// Link-in-bio services and socials that never identify a company.
const IGNORED_DOMAINS = new Set([
  "linktr.ee",
  "bio.link",
  "beacons.ai",
  "bento.me",
  "linkin.bio",
  "t.co",
  "x.com",
  "twitter.com",
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "github.com",
  "linkedin.com",
  "medium.com",
  "substack.com",
]);

function domainFromUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes(".") || IGNORED_DOMAINS.has(host)) return null;
    return host;
  } catch {
    return null;
  }
}

interface BrandLogo {
  url: string;
  mode?: string;
  type?: string;
}

function pickLogo(logos: BrandLogo[] | undefined): string | null {
  if (!logos?.length) return null;
  const icon =
    logos.find((l) => l.type === "icon" && l.mode === "light") ??
    logos.find((l) => l.type === "icon" && l.mode === "has_opaque_background") ??
    logos.find((l) => l.type === "icon") ??
    logos.find((l) => l.mode === "light") ??
    logos[0];
  return icon?.url ?? null;
}

async function brandByDomain(domain: string): Promise<ResolvedCompany | null> {
  const key = process.env.CONTEXT_DEV_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.context.dev/v1/brand/retrieve", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "by_domain", domain }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      brand?: {
        title?: string;
        domain?: string;
        description?: string;
        logos?: BrandLogo[];
      };
    };
    const brand = body.brand;
    if (!brand?.domain || !brand.title) return null;
    return {
      name: brand.title,
      domain: brand.domain,
      logo: pickLogo(brand.logos),
      description: brand.description ?? null,
    };
  } catch {
    return null;
  }
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

function similar(a: string, b: string): boolean {
  if (!a || !b) return false;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length) >= 0.7;
}

/**
 * A brand that's basically the person themselves (their personal site) is
 * not their company - skip it so bio mentions get a chance.
 */
function looksLikePersonalSite(
  brand: ResolvedCompany,
  user: Pick<XUser, "name" | "username">
): boolean {
  const candidates = [norm(brand.name), norm(brand.domain.split(".")[0])];
  const identities = [norm(user.name ?? ""), norm(user.username ?? "")];
  return candidates.some((c) =>
    identities.some((id) => similar(c, id))
  );
}

/** Candidate website URLs from a profile, best first. */
function profileUrls(user: Pick<XUser, "url" | "entities">): string[] {
  const urls: string[] = [];
  for (const u of user.entities?.url?.urls ?? []) {
    if (u.expanded_url) urls.push(u.expanded_url);
  }
  for (const u of user.entities?.description?.urls ?? []) {
    if (u.expanded_url) urls.push(u.expanded_url);
  }
  if (user.url) urls.push(user.url);
  return urls;
}

export async function resolveCompany(
  user: Pick<XUser, "description" | "url" | "entities" | "name" | "username">
): Promise<ResolvedCompany | null> {
  // 1. Their own profile/bio links (skipping their personal site).
  for (const raw of profileUrls(user)) {
    const domain = domainFromUrl(raw);
    if (!domain) continue;
    const brand = await brandByDomain(domain);
    if (brand && !looksLikePersonalSite(brand, user)) return brand;
  }

  // 2. Accounts they @mention in their bio - often the company's X account,
  //    whose profile link points at the company site.
  const mentions = [...(user.description ?? "").matchAll(/@(\w{1,15})/g)]
    .map((m) => m[1])
    .slice(0, 2);
  if (mentions.length > 0) {
    try {
      const accounts = await getUsersByHandles(mentions);
      for (const account of accounts) {
        for (const raw of profileUrls(account)) {
          const domain = domainFromUrl(raw);
          if (!domain) continue;
          const brand = await brandByDomain(domain);
          if (brand) return brand;
        }
      }
    } catch {
      // bio mention lookup is best-effort
    }
  }

  return null;
}
