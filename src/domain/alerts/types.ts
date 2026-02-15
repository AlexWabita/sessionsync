import type { ISODate, ZoneId } from "@/domain/time";

/** What the user can subscribe to. */
export type AlertKind =
  | "session_open"
  | "session_close"
  | "overlap_start"
  | "overlap_end";

/** Which session or overlap it refers to. */
export type AlertTarget =
  | { type: "session"; sessionId: string }
  | { type: "overlap"; overlapId: string }; // overlapId is domain-defined label key

export type AlertRule = {
  id: string;
  enabled: boolean;
  kind: AlertKind;
  target: AlertTarget;

  /** Minutes before the event time (0 = at time). */
  leadMinutes: number;

  /** If true, only trigger on weekdays in display zone. */
  weekdaysOnly: boolean;

  /** Optional: custom label override. */
  label?: string;
};

export type AlertEvent = {
  ruleId: string;
  kind: AlertKind;
  /** When the alert should fire (ISO with offset). */
  atISO: string;
  /** Human label for UI/notifications. */
  title: string;
  body: string;
  /** When the underlying market event happens (open/close/etc). */
  eventAtISO: string;
};

export type AlertsPrefs = {
  /** User-selected display zone; event times are computed in this lens. */
  displayZone: ZoneId;

  /** Alert rules (user editable). */
  alertRules: AlertRule[];

  /** How far ahead we compute events. */
  horizonDays: number;
};

/** Minimal input needed to generate alert events for a given date. */
export type AlertsContext = {
  prefs: AlertsPrefs;
  /** Date to generate for in display zone. */
  displayDate: ISODate;
};
