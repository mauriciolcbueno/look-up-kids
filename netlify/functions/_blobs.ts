import { getStore } from "@netlify/blobs";

/**
 * Returns a configured Blobs store.
 *
 * In production, Netlify injects NETLIFY_BLOBS_CONTEXT as a base64-encoded
 * JSON env var ({siteID, token, primaryRegion, edgeURL, uncachedEdgeURL}).
 * The library is supposed to auto-detect this, but when esbuild bundles the
 * function the auto-detection path can break — so we decode it ourselves
 * and pass siteID + token explicitly. Falls back to the bare auto-config
 * call if the env var isn't present (e.g. during local dev).
 */
export function store(name: string, consistency: "strong" | "eventual" = "eventual") {
  const ctxRaw = process.env.NETLIFY_BLOBS_CONTEXT;
  if (ctxRaw) {
    try {
      const ctx = JSON.parse(
        Buffer.from(ctxRaw, "base64").toString("utf-8")
      ) as { siteID?: string; token?: string };
      if (ctx.siteID && ctx.token) {
        return getStore({ name, siteID: ctx.siteID, token: ctx.token, consistency });
      }
    } catch {
      /* fall through to bare auto-config */
    }
  }
  return getStore({ name, consistency });
}
