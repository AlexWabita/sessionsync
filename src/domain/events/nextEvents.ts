import { DateTime } from "luxon";
import type { ZoneId, ISODate } from "../time";
import { dayStart } from "../time";
import { getDaySessionBlocks } from "../sessions/generateDaySchedule";
import { makeOverlapBlock } from "../overlaps/overlap";
import type { DomainEvent, EventKind } from "./types";

function toMinute(displayDate: ISODate, displayZone: ZoneId, atISO: string): number {
  const at = DateTime.fromISO(atISO).setZone(displayZone);
  const base = dayStart(displayDate, displayZone);
  return Math.round(at.diff(base, "minutes").minutes);
}

// Deterministic tie-break priority (lower = earlier)
const KIND_PRIORITY: Record<EventKind, number> = {
  session_start: 10,
  overlap_start: 20,
  overlap_end: 30,
  session_end: 40,
};

function sortEvents(a: DomainEvent, b: DomainEvent): number {
  const ta = DateTime.fromISO(a.atISO).toMillis();
  const tb = DateTime.fromISO(b.atISO).toMillis();
  if (ta !== tb) return ta - tb;

  const ka = KIND_PRIORITY[a.kind] ?? 999;
  const kb = KIND_PRIORITY[b.kind] ?? 999;
  if (ka !== kb) return ka - kb;

  // stable tie-breaker: label (deterministic)
  return a.label.localeCompare(b.label);
}

export function buildDayEvents(params: {
  displayDate: ISODate;
  displayZone: ZoneId;
}): DomainEvent[] {
  const { displayDate, displayZone } = params;

  const sessions = getDaySessionBlocks({ displayDate, displayZone });

  const events: DomainEvent[] = [];

  for (const s of sessions) {
    events.push({
      kind: "session_start",
      label: `${s.label} opens`,
      atISO: s.startISO,
      atMinute: s.startMinute,
      meta: { session: s.id },
    });

    events.push({
      kind: "session_end",
      label: `${s.label} closes`,
      atISO: s.endISO,
      atMinute: s.endMinute,
      meta: { session: s.id },
    });
  }

  // v1 overlap: London–NY
  const london = sessions.find(s => s.id === "london");
  const ny = sessions.find(s => s.id === "newyork");
  if (london && ny) {
    const ov = makeOverlapBlock({
      a: { ...london, label: "London" },
      b: { ...ny, label: "New York" },
      label: "London–NY overlap",
    });

    if (ov) {
      events.push({
        kind: "overlap_start",
        label: "London–NY overlap starts",
        atISO: ov.startISO,
        atMinute: toMinute(displayDate, displayZone, ov.startISO),
        meta: { a: "london", b: "newyork" },
      });

      events.push({
        kind: "overlap_end",
        label: "London–NY overlap ends",
        atISO: ov.endISO,
        atMinute: toMinute(displayDate, displayZone, ov.endISO),
        meta: { a: "london", b: "newyork" },
      });
    }
  }

  return events.sort(sortEvents);
}

export function getNextEvents(params: {
  nowISO: string;        // current instant
  displayDate: ISODate;  // schedule date baseline
  displayZone: ZoneId;
  limit?: number;
}): DomainEvent[] {
  const { nowISO, displayDate, displayZone, limit = 5 } = params;

  const now = DateTime.fromISO(nowISO).setZone(displayZone);
  if (!now.isValid) throw new Error(`Invalid nowISO: ${nowISO}`);

  const events = buildDayEvents({ displayDate, displayZone });
  const nowMs = now.toMillis();

  const upcoming = events.filter(e => DateTime.fromISO(e.atISO).toMillis() > nowMs);
  return upcoming.slice(0, limit);
}
