import type { Handler } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";
import { verifyAdmin } from "./_admin";

interface Event {
  name: string;
  props: Record<string, unknown>;
  ts: number;
  userId: string;
  day: string;
}

export const handler: Handler = async (event) => {
  const check = await verifyAdmin(event);
  if (!check.ok) {
    return {
      statusCode: check.status,
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
