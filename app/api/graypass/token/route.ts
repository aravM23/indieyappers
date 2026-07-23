import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { collectionOpen, graypassConfig } from "@/lib/graypass";

// Server side of the GrayPass pk/ct/sk model: the browser SDK calls this
// route, we exchange our secret key for a short-lived single-user client
// token (ct_*). The secret key never reaches the browser.

const VISITOR_COOKIE = "gp_vid";

export async function POST() {
  const config = graypassConfig();
  if (!config) {
    return NextResponse.json({ error: "graypass_not_configured" }, { status: 404 });
  }
  if (!collectionOpen(config)) {
    return NextResponse.json({ error: "collection_window_closed" }, { status: 403 });
  }

  // Signed-in founders get a stable per-handle id; anonymous visitors get a
  // random pseudonymous id pinned in a cookie so their sessions correlate
  // across visits. GrayPass pseudonymizes ids again server-side before any
  // frame reaches the training corpus.
  const founder = await getSessionUser();
  const jar = await cookies();
  let userId: string;
  let newVisitorId: string | null = null;
  if (founder) {
    userId = `founder:${founder.handle.toLowerCase()}`;
  } else {
    const existing = jar.get(VISITOR_COOKIE)?.value;
    if (existing && /^v_[a-f0-9]{32}$/.test(existing)) {
      userId = existing;
    } else {
      newVisitorId = `v_${crypto.randomBytes(16).toString("hex")}`;
      userId = newVisitorId;
    }
  }

  const upstream = await fetch(`${config.apiBase}/v2/client-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secretKey}`,
    },
    body: JSON.stringify({ user_id: userId }),
    cache: "no-store",
  });
  if (!upstream.ok) {
    console.error(`graypass client-token mint failed: ${upstream.status}`);
    return NextResponse.json({ error: "graypass_mint_failed" }, { status: 502 });
  }
  const minted = (await upstream.json()) as {
    client_token: string;
    expires_at: number;
    ttl_seconds: number;
    user_id: string;
  };

  const res = NextResponse.json({
    client_token: minted.client_token,
    expires_at: minted.expires_at,
    user_id: minted.user_id,
  });
  if (newVisitorId) {
    res.cookies.set(VISITOR_COOKIE, newVisitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // Slightly past the collection window is enough; the id is useless
      // once collection stops.
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
  }
  return res;
}
