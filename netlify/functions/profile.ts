import type { Handler } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";

interface StoredProfile {
  nickname: string;
  school: string;
  email: string | null;
  updatedAt: number;
  createdAt: number;
}

interface ProfilePayload {
  nickname?: string;
  school?: string;
}

interface NetlifyUser {
  sub?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

function userFromEvent(event: import("@netlify/functions").HandlerEvent): NetlifyUser | null {
  // Netlify Identity injects the verified user into clientContext when the
  // request carries a valid Bearer JWT.
  const ctx = (event as unknown as { clientContext?: { user?: NetlifyUser } }).clientContext;
  return ctx?.user ?? null;
}

export const handler: Handler = async (event) => {
  const user = userFromEvent(event);
  const userId = user?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ status: "error", reason: "Auth required" }),
    };
  }

  bindBlobs(event);
  const bucket = store("profiles", "eventual");
  const key = `${userId}.json`;

  if (event.httpMethod === "GET") {
    const data = (await bucket.get(key, { type: "json" })) as StoredProfile | null;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify(data ?? null),
    };
  }

  if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
    let payload: ProfilePayload = {};
    try {
      payload = JSON.parse(event.body ?? "{}");
    } catch {
      return { statusCode: 400, body: "Bad JSON" };
    }
    const nickname = (payload.nickname ?? "").trim().slice(0, 40);
    const school = (payload.school ?? "").trim().slice(0, 100);
    if (!nickname || !school) {
      return {
        statusCode: 400,
        body: JSON.stringify({ status: "error", reason: "nickname and school required" }),
      };
    }
    const existing = (await bucket.get(key, { type: "json" })) as StoredProfile | null;
    const now = Date.now();
    const profile: StoredProfile = {
      nickname,
      school,
      email: user.email ?? null,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    };
    await bucket.setJSON(key, profile);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
