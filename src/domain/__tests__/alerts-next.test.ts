import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import type { AlertsPrefs } from "@/domain/alerts";
import { getNextAlertEvents } from "@/domain/alerts";

describe("alerts: next events", () => {
  it("returns future events only and sorts", () => {
    const prefs: AlertsPrefs = {
      displayZone: "Africa/Nairobi",
      horizonDays: 7,
      alertRules: [
        {
          id: "r1",
          enabled: true,
          kind: "session_open",
          target: { type: "session", sessionId: "london" },
          leadMinutes: 10,
          weekdaysOnly: false,
          label: "London open -10m",
        },
        {
          id: "r2",
          enabled: true,
          kind: "session_open",
          target: { type: "session", sessionId: "new_york" },
          leadMinutes: 0,
          weekdaysOnly: false,
        },
      ],
    };

    const nowISO = DateTime.now().setZone(prefs.displayZone).toISO()!;
    const events = getNextAlertEvents({ prefs, nowISO, maxItems: 10 });

    // Not empty in most weeks; but even if market closed today, horizon covers next days
    expect(events.length).toBeGreaterThan(0);

    for (let i = 1; i < events.length; i++) {
      const prev = DateTime.fromISO(events[i - 1].atISO).toMillis();
      const cur = DateTime.fromISO(events[i].atISO).toMillis();
      expect(cur).toBeGreaterThanOrEqual(prev);
    }

    for (const e of events) {
      expect(DateTime.fromISO(e.atISO).toMillis()).toBeGreaterThan(DateTime.fromISO(nowISO).toMillis());
      expect(e.title.length).toBeGreaterThan(0);
    }
  });
});
