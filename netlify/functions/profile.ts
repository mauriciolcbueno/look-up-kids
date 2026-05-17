import type { Handler, HandlerResponse } from "@netlify/functions";

const JSON_HEADERS = { "Content-Type": "application/json" };
const NO_CACHE = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function res(statusCode: number, body: unknown, headers: Record<string, string> = JSON_HEADERS): HandlerResponse {
  return { statusCode, headers, body: typeof body === "string" ? body : JSON.stringify(body) };
}
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
  if (!userId) return res(401, { status: "error", reason: "Auth required" });

  bindBlobs(event);
  const bucket = store("profiles", "eventual");
  const key = `${userId}.json`;

  if (event.httpMethod === "GET") {
    const data = (await bucket.get(key, { type: "json" })) as StoredProfile | null;
    return res(200, data ?? null, NO_CACHE);
  }

  if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
    let payload: ProfilePayload = {};
    try {
      payload = JSON.parse(event.body ?? "{}");
    } catch {
      return res(400, { status: "error", reason: "Bad JSON" });
    }
    const nickname = (payload.nickname ?? "").trim().slice(0, 40);
    const school = (payload.school ?? "").trim().slice(0, 100);
    if (!nickname || !school) {
      return res(400, { status: "error", reason: "nickname and school required" });
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
    return res(200, profile);
  }

  return res(405, { status: "error", reason: "Method not allowed" });
};
