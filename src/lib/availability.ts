import type { Locale } from "./i18n";

// Shared, import-safe (no server deps) constants for sitter availability so the
// editor (client), profile (server), and search filter (client) all agree.

export const TIME_SLOTS = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const DAY_LABELS: Record<Locale, string[]> = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export const SLOT_LABELS: Record<Locale, Record<TimeSlot, string>> = {
  ko: { MORNING: "오전", AFTERNOON: "오후", EVENING: "저녁", NIGHT: "밤" },
  en: { MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening", NIGHT: "Night" },
};

// A single availability cell.
export interface Slot {
  dayOfWeek: number; // 0=Sun .. 6=Sat
  slot: TimeSlot;
}

export function slotKey(dayOfWeek: number, slot: TimeSlot): string {
  return `${dayOfWeek}:${slot}`;
}
