import type { Handler } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";
import { isoWeekKey, startOfIsoWeek } from "../../src/lib/scoring";

interface StoredEvent {
  name: string;
  props: Record<string, unknown> & { points?: number };
  ts: number;
  userId: string;
  displayName?: string;
  day: string;
}

const SCORING_EVENTS = new Set(["quiz_question_answered", "wordle_won"]);

export const handler: Handler = async (event) => {
  const limit = Math.min(parseInt(event.queryStringParameters?.limit ?? "3", 10) || 3, 20);

  bindBlobs(event);
  const bucket = store("analytics", "eventual");
  const { blobs } = await bucket.list();

  const weekStartMs = startOfIsoWeek().getTime();
  const totals = new Map<string, { displayName: string; points: number }>();

  for (const b of blobs) {
    const data = (await bucket.get(b.key, { type: "json" })) as StoredEvent | null;
    if (!data) continue;
    if (!SCORING_EVENTS.has(data.name)) continue;
    if (data.ts < weekStartMs) continue;
    if (data.userId === "anon") continue;

    const earned = typeof data.props?.points === "number" ? data.props.points : 0;
    if (earned <= 0) continue;

    const entry = totals.get(data.userId) ?? {
      displayName: data.displayName ?? "Guest",
      points: 0,
    };
    entry.points += earned;
    if (data.displayName) entry.displayName = data.displayName;
    totals.set(data.userId, entry);
  }

  const ranked = [...totals.entries()]
    .map(([userId, v]) => ({ userId, displayName: v.displayName, points: v.points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
    body: JSON.stringify({
      week: isoWeekKey(),
      resetsAt: addDays(startOfIsoWeek(), 7).toISOString(),
      top: ranked,
    }),
  };
};

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}
