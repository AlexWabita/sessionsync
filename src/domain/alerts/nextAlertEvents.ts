import { DateTime } from "luxon";
import type { AlertEvent, AlertsPrefs } from "./types";
import type { ISODate } from "@/domain/time";
import { getAlertEventsForDate } from "./getAlertEventsForDate";

export function getNextAlertEvents(args: {
  prefs: AlertsPrefs;
  nowISO: string;
  maxItems: number;
}): AlertEvent[] {
  const { prefs, nowISO, maxItems } = args;
  const now = DateTime.fromISO(nowISO).setZone(prefs.displayZone);

  const horizonDays = Math.max(1, Math.min(30, prefs.horizonDays || 7));
  const collected: AlertEvent[] = [];

  for (let i = 0; i < horizonDays; i++) {
    const d = now.plus({ days: i }).toISODate() as ISODate;
    const dayEvents = getAlertEventsForDate({ prefs, displayDate: d });

    for (const e of dayEvents) {
      const t = DateTime.fromISO(e.atISO).toMillis();
      if (t <= now.toMillis()) continue;
      collected.push(e);
    }

    if (collected.length >= maxItems * 3) break; // soft cap
  }

  collected.sort((a, b) => {
    const ta = DateTime.fromISO(a.atISO).toMillis();
    const tb = DateTime.fromISO(b.atISO).toMillis();
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title);
  });

  return collected.slice(0, Math.max(1, maxItems | 0));
}
