import { DateTime } from "luxon";
import type { AlertsPrefs, AlertEvent } from "@/domain/alerts";
import { getNextAlertEvents } from "@/domain/alerts";
import type { NotificationsPort } from "@/infrastructure/notifications";

export type AlertDispatchResult = {
  fired: AlertEvent[];
  remaining: AlertEvent[];
};

/**
 * Pure-ish dispatcher:
 * - computes next events,
 * - fires those due within a small window,
 * - returns what it fired.
 *
 * (Later we’ll store “lastFiredAt” and dedupe across reloads.)
 */
export function dispatchDueAlerts(args: {
  prefs: AlertsPrefs;
  nowISO: string;
  notifications: NotificationsPort;
  fireWindowSeconds: number; // e.g. 3..10 sec
  maxScan: number; // e.g. 40
}): AlertDispatchResult {
  const { prefs, nowISO, notifications } = args;
  const now = DateTime.fromISO(nowISO).setZone(prefs.displayZone);
  const windowMs = Math.max(1000, args.fireWindowSeconds * 1000);

  const next = getNextAlertEvents({ prefs, nowISO: now.toISO()!, maxItems: Math.max(5, args.maxScan) });

  const fired: AlertEvent[] = [];
  const remaining: AlertEvent[] = [];

  for (const e of next) {
    const t = DateTime.fromISO(e.atISO).toMillis();
    const dt = t - now.toMillis();

    if (dt <= windowMs && dt >= -windowMs) {
      notifications.notify({ title: e.title, body: e.body, tag: `${e.ruleId}:${e.atISO}` });
      fired.push(e);
    } else {
      remaining.push(e);
    }
  }

  return { fired, remaining };
}
