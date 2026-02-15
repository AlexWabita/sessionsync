import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { buildDayEvents, getNextEvents } from "../events/nextEvents";
import type { ISODate } from "../time";

const EAT = "Africa/Nairobi";

describe("Event tie-break ordering (EAT)", () => {
  it("When two events share the same timestamp, ordering is deterministic", () => {
    // On Jan 15, 2026:
    // New York opens at 16:00 EAT, and overlap starts at 16:00 EAT (same instant).
    const displayDate = "2026-01-15" as ISODate;

    const events = buildDayEvents({ displayDate, displayZone: EAT });

    const at1600 = events.filter(e =>
      DateTime.fromISO(e.atISO).setZone(EAT).toFormat("HH:mm") === "16:00"
    );

    // We expect at least NY open + overlap start at same time
    expect(at1600.length).toBeGreaterThanOrEqual(2);

    // With our priority: session_start comes before overlap_start
    const firstTwoKinds = at1600.slice(0, 2).map(e => e.kind);
    expect(firstTwoKinds[0]).toBe("session_start");
    expect(firstTwoKinds[1]).toBe("overlap_start");

    // And the "next events" list preserves that ordering
    const nowISO = DateTime.fromISO("2026-01-15T15:55:00", { zone: EAT }).toISO()!;
    const next = getNextEvents({ nowISO, displayDate, displayZone: EAT, limit: 5 });

    const firstAt1600 = next.find(e =>
      DateTime.fromISO(e.atISO).setZone(EAT).toFormat("HH:mm") === "16:00"
    );

    expect(firstAt1600).toBeTruthy();
    expect(firstAt1600!.kind).toBe("session_start");
  });
});
