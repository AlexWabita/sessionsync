import { DateTime } from "luxon";
import type { ISODate, ZoneId } from "@/domain/time";
import type { AlertEvent, AlertRule, AlertsPrefs } from "./types";
import { getScheduleForDate } from "@/application/useCases/getScheduleForDate";
import { DEFAULT_PREFS } from "@/domain/prefs";

function isWeekdayInZone(iso: string, zone: ZoneId): boolean {
  const wd = DateTime.fromISO(iso).setZone(zone).weekday; // 1..7 (Mon..Sun)
  return wd >= 1 && wd <= 5;
}

function applyLead(eventAtISO: string, leadMinutes: number): string {
  return DateTime.fromISO(eventAtISO).minus({ minutes: leadMinutes }).toISO()!;
}

function titleFor(rule: AlertRule): string {
  if (rule.label && rule.label.trim()) return rule.label.trim();
  if (rule.target.type === "session") return `${rule.target.sessionId} ${rule.kind.replace("_", " ")}`;
  return `${rule.target.overlapId} ${rule.kind.replace("_", " ")}`;
}

function bodyFor(kind: AlertRule["kind"], eventAtISO: string, displayZone: ZoneId): string {
  const t = DateTime.fromISO(eventAtISO).setZone(displayZone).toFormat("HH:mm");
  switch (kind) {
    case "session_open":
      return `Opens at ${t} (${displayZone})`;
    case "session_close":
      return `Closes at ${t} (${displayZone})`;
    case "overlap_start":
      return `Overlap starts at ${t} (${displayZone})`;
    case "overlap_end":
      return `Overlap ends at ${t} (${displayZone})`;
  }
}

/**
 * Generate alert firing events for a single display date.
 * Uses schedule that is already DST-correct in your app.
 *
 * Note: schedule generation expects the full UserPrefs shape, so we adapt from DEFAULT_PREFS.
 */
export function getAlertEventsForDate(args: {
  prefs: AlertsPrefs;
  displayDate: ISODate;
}): AlertEvent[] {
  const { prefs, displayDate } = args;

  const schedule = getScheduleForDate({
    prefs: {
      ...DEFAULT_PREFS,
      displayZone: prefs.displayZone,
    },
    displayDate,
  });

  const out: AlertEvent[] = [];

  for (const rule of prefs.alertRules ?? []) {
    if (!rule.enabled) continue;

    const tgt = rule.target;

    let eventAtISO: string | null = null;

    if (tgt.type === "session") {
      const sid = tgt.sessionId;
      const s = schedule.sessions.find((x) => x.id === sid || x.label === sid);
      if (!s) continue;

      eventAtISO = rule.kind === "session_open" ? s.startISO : rule.kind === "session_close" ? s.endISO : null;
    } else {
      const oid = tgt.overlapId;
      const o = schedule.overlaps.find((x) => x.label === oid);
      if (!o) continue;

      eventAtISO = rule.kind === "overlap_start" ? o.startISO : rule.kind === "overlap_end" ? o.endISO : null;
    }

    if (!eventAtISO) continue;

    if (rule.weekdaysOnly && !isWeekdayInZone(eventAtISO, prefs.displayZone)) continue;

    const atISO = applyLead(eventAtISO, Math.max(0, rule.leadMinutes | 0));

    out.push({
      ruleId: rule.id,
      kind: rule.kind,
      atISO,
      eventAtISO,
      title: titleFor(rule),
      body: bodyFor(rule.kind, eventAtISO, prefs.displayZone),
    });
  }

  out.sort((a, b) => {
    const ta = DateTime.fromISO(a.atISO).toMillis();
    const tb = DateTime.fromISO(b.atISO).toMillis();
    if (ta !== tb) return ta - tb;
    return a.title.localeCompare(b.title);
  });

  return out;
}
