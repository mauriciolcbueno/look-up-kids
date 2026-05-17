import { currentJwt } from "./identity";

export interface ServerProfile {
  nickname: string;
  school: string;
  email: string | null;
  updatedAt: number;
  createdAt: number;
}

export async function fetchProfile(): Promise<ServerProfile | null> {
  const token = await currentJwt();
  if (!token) return null;
  try {
    const res = await fetch("/.netlify/functions/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerProfile | null;
  } catch {
    return null;
  }
}

export async function saveProfile(nickname: string, school: string): Promise<ServerProfile | null> {
  const token = await currentJwt();
  if (!token) return null;
  try {
    const res = await fetch("/.netlify/functions/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname, school }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerProfile;
  } catch {
    return null;
  }
}

export interface AskResult {
  status: "ok" | "blocked" | "error";
  answer?: string;
  source?: { title: string; url: string };
  reason?: string;
}

export async function askQuestion(question: string): Promise<AskResult> {
  const token = await currentJwt();
  try {
    const res = await fetch("/.netlify/functions/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && data.status === "blocked") return data;
      return { status: "error", reason: data.reason ?? `Server error ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    return { status: "error", reason: (err as Error).message };
  }
}
