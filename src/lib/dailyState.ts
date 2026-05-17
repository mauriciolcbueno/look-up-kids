/**
 * Per-device tracking of which challenges the user has finished today.
 * Each challenge can be done once per day; after that the home page
 * shows it as completed until midnight (UTC date rollover).
 *
 * Source of truth for fairness is server-side dedup in the leaderboard
 * function — this is just for UX (graying out the cards, etc).
 */

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const KEY = (kind: string, id: string = "") =>
  `lookup:done:${kind}${id ? `:${id}` : ""}:${todayKey()}`;

export function isQuizDoneToday(categoryId: string): boolean {
  try {
    return localStorage.getItem(KEY("quiz", categoryId)) === "1";
  } catch {
    return false;
  }
}

export function markQuizDoneToday(categoryId: string): void {
  try {
    localStorage.setItem(KEY("quiz", categoryId), "1");
  } catch {
    /* ignore quota issues */
  }
}

export function isWordleDoneToday(): boolean {
  try {
    return localStorage.getItem(KEY("wordle")) === "1";
  } catch {
    return false;
  }
}

export function markWordleDoneToday(): void {
  try {
    localStorage.setItem(KEY("wordle"), "1");
  } catch {
    /* ignore */
  }
}
