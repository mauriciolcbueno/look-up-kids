import type { Handler } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let payload: {
    name?: string;
    props?: Record<string, unknown>;
    ts?: number;
    userId?: string;
    displayName?: string;
  };
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Bad JSON" };
  }

  if (!payload.name) return { statusCode: 400, body: "Missing name" };

  bindBlobs(event);
  const bucket = store("analytics", "eventual");
  const day = new Date().toISOString().slice(0, 10);
  const eventId = `${day}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;

  await bucket.setJSON(eventId, {
    name: payload.name,
    props: payload.props ?? {},
    ts: payload.ts ?? Date.now(),
    userId: payload.userId ?? "anon",
    displayName: payload.displayName ?? "Guest",
    day,
  });

  return { statusCode: 204, body: "" };
};
