import type { Handler, HandlerEvent } from "@netlify/functions";
import { bindBlobs, store } from "./_blobs";

interface StoredProfile {
  nickname: string;
  school: string;
  email: string | null;
  updatedAt: number;
  createdAt: number;
}

function isAdmin(event: HandlerEvent): boolean {
  const ctx = (event as unknown as { clientContext?: { user?: { app_metadata?: { roles?: string[] } } } })
    .clientContext;
  const roles = ctx?.user?.app_metadata?.roles ?? [];
  return roles.includes("admin");
}

export const handler: Handler = async (event) => {
  if (!isAdmin(event)) return { statusCode: 403, body: "Forbidden" };

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
