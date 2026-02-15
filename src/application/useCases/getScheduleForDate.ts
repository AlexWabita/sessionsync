import type { ISODate, ZoneId } from "../../domain/time";
import type { UserPrefs } from "../../domain/prefs";
import { getDaySessionBlocks, type SessionBlock } from "../../domain/sessions";
import { makeOverlapBlock, type OverlapBlock } from "../../domain/overlaps";
import { buildDayEvents, type DomainEvent } from "../../domain/events";

export interface DaySchedule {
  displayDate: ISODate;
  displayZone: ZoneId;
  sessions: SessionBlock[];
  overlaps: OverlapBlock[];
  events: DomainEvent[];
}

export function getScheduleForDate(params: {
  prefs: UserPrefs;
  displayDate: ISODate;
}): DaySchedule {
  const { prefs, displayDate } = params;
  const displayZone = prefs.displayZone;

  const allSessions = getDaySessionBlocks({ displayDate, displayZone });
  const sessions = allSessions.filter(s => prefs.enabledSessions.includes(s.id));

  const overlaps: OverlapBlock[] = [];
  const london = sessions.find(s => s.id === "london");
  const ny = sessions.find(s => s.id === "newyork");
  if (london && ny) {
    const ov = makeOverlapBlock({
      a: { ...london, label: "London" },
      b: { ...ny, label: "New York" },
      label: "London–NY overlap",
    });
    if (ov) overlaps.push(ov);
  }

  // Events currently generated for all core sessions + overlap; later we’ll filter by prefs
  const events = buildDayEvents({ displayDate, displayZone });

  return { displayDate, displayZone, sessions, overlaps, events };
}
