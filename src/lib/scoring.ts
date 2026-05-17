/**
 * Pure scoring functions shared by client (preview) and server (leaderboard).
 * Keep this file dependency-free so both runtimes can import it.
 */

export const QUIZ_BASE = 100;
export const QUIZ_FLOOR = 10;
export const QUIZ_SPEED_PENALTY_PER_SECOND = 5;

export const WORDLE_BASE = 200;
export const WORDLE_PER_TRY_BONUS = 50;
export const WORDLE_MAX_TRIES = 6;

export function quizPoints(correct: boolean, elapsedMs: number): number {
  if (!correct) return 0;
  const seconds = Math.max(0, elapsedMs / 1000);
  const score = QUIZ_BASE - Math.round(seconds * QUIZ_SPEED_PENALTY_PER_SECOND);
  return Math.max(QUIZ_FLOOR, score);
}

export function wordlePoints(attempts: number): number {
  const remaining = Math.max(0, WORDLE_MAX_TRIES - attempts);
  return WORDLE_BASE + remaining * WORDLE_PER_TRY_BONUS;
}

/** Returns an ISO week key like "2026-W03" (Monday = first day of week). */
export function isoWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Returns Monday 00:00 UTC of the week containing `date`. */
export function startOfIsoWeek(date: Date = new Date()): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dayNum - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
