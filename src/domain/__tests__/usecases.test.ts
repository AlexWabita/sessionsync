import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { getScheduleForDate } from "../../application/useCases/getScheduleForDate";
import { getNextEventsForUser } from "../../application/useCases/getNextEventsForUser";
import { DEFAULT_PREFS } from "../prefs/types";
import type { ISODate } from "../time";

const EAT = "Africa/Nairobi";

describe("Use-cases", () => {
  it("getScheduleForDate returns sessions + overlaps for EAT", () => {
    const schedule = getScheduleForDate({
      prefs: DEFAULT_PREFS,
      displayDate: "2026-01-15" as ISODate,
    });

    expect(schedule.displayZone).toBe(EAT);
    expect(schedule.sessions.length).toBe(4);

    // London–NY overlap should exist on a normal weekday
    expect(schedule.overlaps.length).toBe(1);
    expect(schedule.overlaps[0].label).toContain("London–NY");
  });

  it("getNextEventsForUser respects prefs.alerts.kindsEnabled filter", () => {
    const prefs = {
      ...DEFAULT_PREFS,
      alerts: { ...DEFAULT_PREFS.alerts, kindsEnabled: ["overlap_start"] },
    };

    const displayDate = "2026-01-15" as ISODate;
    const nowISO = DateTime.fromISO("2026-01-15T14:00:00", { zone: EAT }).toISO()!;

    const next = getNextEventsForUser({ prefs, nowISO, displayDate, limit: 10 });

    expect(next.length).toBeGreaterThan(0);
    expect(next.every(e => e.kind === "overlap_start")).toBe(true);
  });
});
