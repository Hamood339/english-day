import type { Member } from "../types/member";

/** Returns members sorted by mistakes, highest first. */
export function sortByMistakes(members: Member[]): Member[] {
  return [...members].sort((a, b) => b.mistakes - a.mistakes);
}

/** The member(s) with the most mistakes — ties share the penalty. */
export function getMostWanted(members: Member[]): Member[] {
  if (members.length === 0) return [];
  const max = Math.max(...members.map((m) => m.mistakes));
  if (max === 0) return [];
  return members.filter((m) => m.mistakes === max);
}

/** The member(s) with the fewest mistakes — most disciplined. */
export function getMostDisciplined(members: Member[]): Member[] {
  if (members.length === 0) return [];
  const min = Math.min(...members.map((m) => m.mistakes));
  return members.filter((m) => m.mistakes === min);
}

export function getTotalMistakes(members: Member[]): number {
  return members.reduce((sum, m) => sum + m.mistakes, 0);
}

/** Fallback shown before the shared penalty amount loads from the server. */
export const PENALTY_AMOUNT_FCFA = 100;

export function todayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function formatDisplayDate(dateKey: string): string {
  const date = new Date(dateKey + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
