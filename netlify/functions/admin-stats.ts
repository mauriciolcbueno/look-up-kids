import type { Handler, HandlerEvent } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";

interface Event {
  name: string;
  props: Record<string, unknown>;
  ts: number;
  userId: string;
  day: string;
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
  const bucket = store("analytics", "eventual");
  const { blobs } = await bucket.list();

  const events: Event[] = [];
  for (const b of blobs) {
    const data = await bucket.get(b.key, { type: "json" });
    if (data) events.push(data as Event);
  }

  events.sort((a, b) => a.ts - b.ts);

  const byDay: Record<string, number> = {};
  const byName: Record<string, number> = {};
  const uniqueUsers = new Set<string>();
  const askLatest: { question?: string; answeredAt?: number; status?: string }[] = [];

  for (const e of events) {
    byDay[e.day] = (byDay[e.day] ?? 0) + 1;
    byName[e.name] = (byName[e.name] ?? 0) + 1;
    if (e.userId && e.userId !== "anon") uniqueUsers.add(e.userId);
    if (e.name === "ask_answered" || e.name === "ask_blocked") {
      askLatest.push({ status: e.name, answeredAt: e.ts });
    }
  }

  const seriesDays = Object.keys(byDay).sort();
  const series = seriesDays.map((d) => ({ day: d, count: byDay[d] }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      totalEvents: events.length,
      uniqueUsers: uniqueUsers.size,
      byName,
      series,
      recent: events.slice(-30).reverse(),
    }),
  };
};
