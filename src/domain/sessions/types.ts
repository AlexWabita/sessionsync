import type { HHmm, ZoneId } from "../time";

export type SessionId = "sydney" | "tokyo" | "london" | "newyork";

export interface SessionDefinition {
  id: SessionId;
  label: string;

  // The session's "home" timezone (venue)
  venueZone: ZoneId;

  // Session hours in venue-local time
  localStart: HHmm;
  localEnd: HHmm;
}

export interface SessionBlock {
  id: SessionId;
  label: string;

  // Absolute instants, represented as ISO strings (with offset)
  startISO: string;
  endISO: string;

  // For UI: minutes relative to display day start (can be <0 or >1440 for cross-day)
  startMinute: number;
  endMinute: number;

  spansNextDay: boolean;
}
