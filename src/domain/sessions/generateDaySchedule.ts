import type { ISODate, ZoneId } from "../time";
import { atLocalTime, dayStart, midday, toISODate } from "../time";
import type { SessionBlock, SessionId } from "./types";
import { SESSION_DEFS } from "./definitions";

function getDef(id: SessionId) {
  const def = SESSION_DEFS.find(d => d.id === id);
  if (!def) throw new Error(`Unknown session id: ${id}`);
  return def;
}

/**
 * Generate a single session block for a given DISPLAY date + DISPLAY timezone.
 *
 * Key idea:
 * - We map the display date -> venue date using DISPLAY midday.
 *   (This avoids off-by-one issues near midnight due to large offsets.)
 * - Then we build the session start/end in venue-local time on that venue date.
 * - Finally we convert instants back to display zone and compute UI minutes.
 */
export function getSessionBlock(params: {
  sessionId: SessionId;
  displayDate: ISODate;
  displayZone: ZoneId;
}): SessionBlock {
  const { sessionId, displayDate, displayZone } = params;
  const def = getDef(sessionId);

  const displayMid = midday(displayDate, displayZone);
  const venueDate = toISODate(displayMid.setZone(def.venueZone));

  const startVenue = atLocalTime(venueDate, def.localStart, def.venueZone);
  let endVenue = atLocalTime(venueDate, def.localEnd, def.venueZone);

  // If end <= start in venue-local, it means the session crosses midnight.
  // (Not expected for our 08:00–17:00 definitions, but we handle it for future extensions.)
  if (endVenue <= startVenue) {
    endVenue = endVenue.plus({ days: 1 });
  }

  const startDisplay = startVenue.setZone(displayZone);
  const endDisplay = endVenue.setZone(displayZone);

  const displayStart = dayStart(displayDate, displayZone);
  const startMinute = Math.round(startDisplay.diff(displayStart, "minutes").minutes);
  const endMinute = Math.round(endDisplay.diff(displayStart, "minutes").minutes);

  return {
    id: def.id,
    label: def.label,
    startISO: startDisplay.toISO() ?? (() => { throw new Error("startISO null"); })(),
    endISO: endDisplay.toISO() ?? (() => { throw new Error("endISO null"); })(),
    startMinute,
    endMinute,
    spansNextDay: endMinute > 1440,
  };
}

/**
 * Convenience: generate all major session blocks for a display date.
 */
export function getDaySessionBlocks(params: {
  displayDate: ISODate;
  displayZone: ZoneId;
}): SessionBlock[] {
  const ids: SessionId[] = ["sydney", "tokyo", "london", "newyork"];
  return ids.map(sessionId => getSessionBlock({ sessionId, ...params }));
}


