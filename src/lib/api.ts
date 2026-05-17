import { currentJwt } from "./identity";

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
