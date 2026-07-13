import type { Handler, HandlerEvent } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";

interface StoredProfile {
  nickname: string;
  school: string;
  email: string | null;
  updatedAt: number;
  createdAt: number;
}

interface WithContext {
  clientContext?: {
    user?: {
      email?: string;
      app_metadata?: { roles?: string[] };
    };
  };
}

function adminCheck(event: HandlerEvent): { ok: true } | { ok: false; reason: string; seen: unknown } {
  const ctx = (event as unknown as WithContext).clientContext;
  const authHeader =
    event.headers?.authorization ?? event.headers?.Authorization ?? null;
  if (!ctx?.user) {
    return {
      ok: false,
      reason: "No Netlify Identity user in clientContext (JWT missing or invalid)",
      seen: { hasAuthHeader: !!authHeader, clientContext: ctx ?? null },
    };
  }
  const roles = ctx.user.app_metadata?.roles ?? [];
  if (!roles.includes("admin")) {
    return {
      ok: false,
      reason: "User has no 'admin' role in app_metadata.roles",
      seen: { email: ctx.user.email, roles, app_metadata: ctx.user.app_metadata },
    };
  }
  return { ok: true };
}

export const handler: Handler = async (event) => {
  const check = adminCheck(event);
  if (!check.ok) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Forbidden", reason: check.reason, seen: check.seen }),
    };
  }

  bindBlobs(event);
  const bucket = store("profiles", "eventual");
  const { blobs } = await bucket.list();

  const profiles: Array<StoredProfile & { userId: string }> = [];
  for (const b of blobs) {
    const data = (await bucket.get(b.key, { type: "json" })) as StoredProfile | null;
    if (data) {
      const userId = b.key.replace(/\.json$/, "");
      profiles.push({ userId, ...data });
    }
  }

  profiles.sort((a, b) => b.createdAt - a.createdAt);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ total: profiles.length, profiles }),
  };
};
