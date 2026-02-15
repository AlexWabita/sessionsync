import type { ISODate } from "../../domain/time";
import type { UserPrefs } from "../../domain/prefs";
import { getNextEvents, type DomainEvent } from "../../domain/events";
import type { AlertKind } from "@/domain/prefs";


export function getNextEventsForUser(params: {
  prefs: UserPrefs;
  nowISO: string;
  displayDate: ISODate;
  limit?: number;
}): DomainEvent[] {
  const { prefs, nowISO, displayDate, limit } = params;

  const next = getNextEvents({
    nowISO,
    displayDate,
    displayZone: prefs.displayZone,
    limit,
  });

  // Apply alert kinds filter (notification layer will use this)
  const kinds = new Set<AlertKind>(prefs.alerts.kindsEnabled);

const kindMap: Record<string, AlertKind> = {
  session_start: "session_open",
  session_end: "session_close",
  session_open: "session_open",
  session_close: "session_close",
  overlap_start: "overlap_start",
  overlap_end: "overlap_end",
};

function toAlertKind(k: unknown): AlertKind | null {
  if (typeof k !== "string") return null;
  return kindMap[k] ?? null;
}

  return next.filter((e) => {
  const ak = toAlertKind(e.kind);
  return ak ? kinds.has(ak) : false;
});
}

