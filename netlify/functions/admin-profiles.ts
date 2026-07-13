import type { Handler, HandlerResponse } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";
import { verifyAdmin } from "./_admin";

interface StoredProfile {
  nickname: string;
  school: string;
  email: string | null;
  updatedAt: number;
  createdAt: number;
}

export const handler: Handler = async (event) => {
  const check = await verifyAdmin(event);
  if (!check.ok) {
    const forbidden: HandlerResponse = {
      statusCode: check.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Forbidden", reason: check.reason, seen: check.seen }),
    };
    return forbidden;
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

  const ok: HandlerResponse = {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ total: profiles.length, profiles }),
  };
  return ok;
};
