
import type { ZoneId } from "@/domain/time";

export type AlertKind =
  | "session_open"
  | "session_close"
  | "overlap_start"
  | "overlap_end";

export type AlertTarget =
  | { type: "session"; sessionId: string }
  | { type: "overlap"; overlapId: string };

export type AlertRule = {
  id: string;
  enabled: boolean;
  kind: AlertKind;
  target: AlertTarget;
  // minutes BEFORE the event (0 = at event time)
  offsetMinutes: number;
  // if true, only Mon–Fri in displayZone
  weekdaysOnly: boolean;
};

export type AlertsPrefs = {
  enabled: boolean;
  // which timezone determines weekday/weekend & "today" for alert evaluation
  displayZone: ZoneId;
  // how far ahead to generate alert events
  horizonDays: number;
  // global enable/disable by alert type (notification layer uses this filter)
  kindsEnabled: AlertKind[];
  // user-defined rules (v0 can be empty; we’ll add UI for this next)
  rules: AlertRule[];
};

export const DEFAULT_ALERTS_PREFS: AlertsPrefs = {
  enabled: true,
  displayZone: "Africa/Nairobi",
  horizonDays: 7,
  kindsEnabled: ["session_open", "overlap_start"],
  rules: [],
};

