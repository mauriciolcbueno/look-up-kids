import netlifyIdentity from "netlify-identity-widget";
import { currentJwt } from "./identity";

export type EventName =
  | "page_view"
  | "ask_submitted"
  | "ask_answered"
  | "ask_blocked"
  | "ask_audio_played"
  | "quiz_started"
  | "quiz_question_answered"
  | "quiz_completed"
  | "wordle_started"
  | "wordle_guess"
  | "wordle_won"
  | "wordle_lost";

function readLocalProfile(key: string): { nickname?: string; school?: string } {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function logEvent(name: EventName, props: Record<string, unknown> = {}) {
  try {
    const user = netlifyIdentity.currentUser();
    const token = await currentJwt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (user?.user_metadata ?? {}) as any;
    const stashed = user ? readLocalProfile(`lookup:profile:${user.id ?? user.email}`) : {};
    const displayName =
      meta.nickname ?? stashed.nickname ?? meta.full_name ?? user?.email ?? "Guest";
    await fetch("/.netlify/functions/log-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name,
        props,
        ts: Date.now(),
        userId: user?.id ?? "anon",
        displayName,
      }),
    });
  } catch {
    // analytics never blocks the UI
  }
}
