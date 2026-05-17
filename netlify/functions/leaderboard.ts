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

// Scoring events: each completed quiz fires `quiz_completed` once with the
// session's total points, and each Wordle win fires `wordle_won` once.
// We also accept legacy `quiz_question_answered` events for back-compat with
// data logged before the dedup rules existed.
const SCORING_EVENTS = new Set(["quiz_completed", "wordle_won", "quiz_question_answered"]);

export const handler: Handler = async (event) => {
  const limit = Math.min(parseInt(event.queryStringParameters?.limit ?? "3", 10) || 3, 20);

  bindBlobs(event);
  const bucket = store("analytics", "eventual");
  const { blobs } = await bucket.list();

  const weekStartMs = startOfIsoWeek().getTime();
  const totals = new Map<string, { displayName: string; points: number }>();
  // Dedup: each challenge counts ONCE per user per day. Key shape:
  //   `${userId}|${day}|quiz|${category}` for completed quizzes
  //   `${userId}|${day}|wordle`           for Wordle
  // First matching event wins; later attempts are ignored.
  const claimed = new Set<string>();
  // Pre-claim quiz_completed slots so legacy per-question events don't
  // double-count when a quiz_completed event exists for the same session.
  // (Walked in two passes: first quiz_completed/wordle_won, then legacy.)
  const events: StoredEvent[] = [];
  for (const b of blobs) {
    const data = (await bucket.get(b.key, { type: "json" })) as StoredEvent | null;
    if (!data) continue;
    if (!SCORING_EVENTS.has(data.name)) continue;
    if (data.ts < weekStartMs) continue;
    if (data.userId === "anon") continue;
    events.push(data);
  }
  // Order events by timestamp so the "first" semantics are well-defined.
  events.sort((a, b) => a.ts - b.ts);

  function dedupKey(e: StoredEvent): string {
    if (e.name === "wordle_won") return `${e.userId}|${e.day}|wordle`;
    const cat = (e.props as { category?: string }).category ?? "unknown";
    return `${e.userId}|${e.day}|quiz|${cat}`;
  }

  // First pass: prefer modern events (quiz_completed, wordle_won)
  for (const data of events) {
    if (data.name === "quiz_question_answered") continue;
    const key = dedupKey(data);
    if (claimed.has(key)) continue;
    const earned = typeof data.props?.points === "number" ? data.props.points : 0;
    if (earned <= 0) continue;
    claimed.add(key);
    const entry = totals.get(data.userId) ?? { displayName: data.displayName ?? "Guest", points: 0 };
    entry.points += earned;
    if (data.displayName) entry.displayName = data.displayName;
    totals.set(data.userId, entry);
  }
  // Second pass: legacy per-question events for slots not yet claimed
  for (const data of events) {
    if (data.name !== "quiz_question_answered") continue;
    const key = dedupKey(data);
    if (claimed.has(key)) continue;
    const earned = typeof data.props?.points === "number" ? data.props.points : 0;
    if (earned <= 0) continue;
    // Legacy: don't mark claimed yet — let all 5 questions of the same quiz
    // session contribute, but only for that session.
    const entry = totals.get(data.userId) ?? { displayName: data.displayName ?? "Guest", points: 0 };
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
      // Short cache: leaderboards should feel live after a kid finishes a game.
      "Cache-Control": "public, max-age=10",
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
