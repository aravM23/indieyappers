/**
 * Backfill company info for sign-ups that joined before automatic company
 * resolution existed (or where it failed). Looks at each member's X profile
 * link and bio mentions, resolves the brand via context.dev, and updates
 * both the shared Postgres store and the local SQLite pipeline copy.
 *
 * Run via: npm run resolve-companies
 * Requires X_BEARER_TOKEN, CONTEXT_DEV_API_KEY, DATABASE_URL.
 */
import { getDb } from "../lib/db";
import { pgListJoinedFounders, pgUpdateJoinedCompany } from "../lib/pgstore";
import { resolveCompany } from "../lib/company-resolve";
import { getUsersByHandles } from "../lib/x-api";

async function main() {
  const joined = await pgListJoinedFounders();
  const missing = joined.filter((j) => !j.company_name);
  console.log(`${missing.length} sign-ups without a company...`);
  if (missing.length === 0) return;

  const profiles = await getUsersByHandles(missing.map((j) => j.handle));
  const byHandle = new Map(profiles.map((p) => [p.username.toLowerCase(), p]));

  const db = getDb();
  const updateSqlite = db.prepare(`
    UPDATE founders SET product = ?, company_domain = ?, company_logo = ?, company_desc = ?
    WHERE LOWER(handle) = LOWER(?)
  `);

  for (const j of missing) {
    const profile = byHandle.get(j.handle.toLowerCase());
    if (!profile) {
      console.log(`  @${j.handle}: profile not found`);
      continue;
    }
    const company = await resolveCompany(profile);
    if (!company) {
      console.log(`  @${j.handle}: no company found`);
      continue;
    }
    await pgUpdateJoinedCompany(j.handle, company);
    updateSqlite.run(
      company.name,
      company.domain,
      company.logo,
      company.description,
      j.handle
    );
    console.log(`  @${j.handle} -> ${company.name} (${company.domain})`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
