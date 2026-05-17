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

export async function logEvent(name: EventName, props: Record<string, unknown> = {}) {
  try {
    const user = netlifyIdentity.currentUser();
    const token = await currentJwt();
    const displayName =
      (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "Guest";
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
