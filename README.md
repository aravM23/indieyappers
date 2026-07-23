# Yapper

A leaderboard dashboard ranking 101 indie tech founders by how much they've been yapping on X. Built with Next.js, Tailwind, and SQLite, styled after the Stanley design system.

## How it works

- `data/founders.json` is the seed list (handle, name, product, tier, approximate followers) sourced from the curated spreadsheet.
- `npm run refresh` hits the X API v2 with a read-only bearer token: it batch-resolves all handles via `GET /2/users/by` (profile image, follower count, lifetime tweet count), then pulls each founder's last 30 days of posts via `GET /2/users/:id/tweets` and stores a dated snapshot in SQLite (`data/yapper.db`).
- The dashboard ranks founders by **Yap Score**: originals count 1.0, replies 0.5, retweets 0.25. Toggle between 7-day and 30-day windows.
- Snapshots accumulate over time, which powers the "biggest riser" stat (needs at least two refreshes).

## Getting started

```bash
npm install

# Option A: demo data, no API token needed
npm run mock

# Option B: real data
cp .env.example .env.local   # then paste your X_BEARER_TOKEN
npm run refresh

npm run dev                  # http://localhost:3000
```

The bearer token comes from a read-only app in the [X developer console](https://developer.x.com/). The refresh script handles rate limits by waiting and retrying, so a full run over 101 accounts may take a few minutes on the basic tier.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dashboard |
| `npm run refresh` | Pull live data from the X API and snapshot it |
| `npm run mock` | Seed deterministic demo data (replaces existing snapshots) |
| `node scripts/csv-to-seed.mjs <csv>` | Regenerate `data/founders.json` from a spreadsheet export |

## Roadmap

- Threads will be added to this later.

## GrayPass monitoring (time-boxed)

The site can run a two-week passive data-collection study for [GrayPass](https://graypass.org): the drop-in SDK loads in monitor mode, asks each visitor for consent, and then streams anonymized interaction-pattern frames (typing rhythm, mouse movement, scrolling — never text or page contents) to the GrayPass API. Frames are observation-only (`purpose="enroll"`, `research_optin=true`); GrayPass pseudonymizes them server-side into its `research_donations` training corpus. No overlays, no login gating — visitors who decline are never re-prompted.

Enable it by setting all four env vars (see `.env.example`): `GRAYPASS_API_BASE`, `GRAYPASS_PUBLISHABLE_KEY`, `GRAYPASS_SECRET_KEY`, and `GRAYPASS_COLLECT_UNTIL` (14 days after launch). The cutoff is enforced in three places — the layout stops injecting the script, `/api/graypass/token` refuses to mint tokens, and the SDK's `data-until` stops a running loop — so the study ends on time even without a redeploy.

On the GrayPass deployment itself, two settings must be in place or the data is silently discarded / blocked:

- `GRAYPASS_RESEARCH_DONATIONS=1` — otherwise the research opt-in is ignored and nothing is persisted for training.
- `GRAYPASS_ALLOWED_ORIGINS` must include `https://indiehackers.getstanley.ai` — otherwise the browser's cross-origin frame posts fail CORS.

## Structure

- `app/` — Next.js App Router pages (server-rendered leaderboard)
- `components/` — stat cards, top-3 cards, table, window toggle
- `lib/` — SQLite access, leaderboard queries, X API client, Yap Score
- `scripts/` — refresh, mock seeding, CSV conversion
- `data/` — committed seed JSON; the SQLite database lives here too (gitignored)
