import type { ZoneId } from "../time";
import type { SessionId } from "../sessions";
import type { EventKind } from "../events";
import type { AlertsPrefs } from "@/domain/prefs";
import { DEFAULT_ALERTS_PREFS } from "./alerts";

export interface QuietHours {
  enabled: boolean;
  startHHmm: string; // validated as HH:mm
  endHHmm: string;   // validated as HH:mm
}

export interface AlertPrefs {
  enabled: boolean;

  // Which kinds of events the user wants alerts for
  kindsEnabled: EventKind[];

  // Notify X minutes before the event
  leadMinutes: number;

  // Do not notify on weekends
  weekendsOff: boolean;

  // Optional quiet hours window in display timezone
  quietHours: QuietHours;
}

export interface UserPrefs {
  version: 1;

  // Main schedule display timezone (default EAT)
  displayZone: ZoneId;
  alerts: AlertsPrefs;

  // Clocks shown in the UI (multi-timezone clock rail)
  pinnedClocks: ZoneId[];

  // Sessions the user wants to see
  enabledSessions: SessionId[];

  // Alert preferences
}

export const DEFAULT_PREFS: UserPrefs = {
  version: 1,
  displayZone: "Africa/Nairobi",
  pinnedClocks: [
    "Africa/Nairobi",
    "UTC",
    "Europe/London",
    "America/New_York",
    "Asia/Tokyo",
    "Australia/Sydney",
  ],
  enabledSessions: ["sydney", "tokyo", "london", "newyork"],
  alerts: DEFAULT_ALERTS_PREFS,
};





