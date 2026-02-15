import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { getNextEvents } from "../events/nextEvents";
import type { ISODate } from "../time";

const EAT = "Africa/Nairobi";

describe("Next Events (EAT)", () => {
  it("Returns future events sorted by time", () => {
    const displayDate = "2026-01-15" as ISODate;

    // Choose a 'now' at 14:00 EAT: next should be NY open at 16:00 (in Jan regime)
    const nowISO = DateTime.fromISO("2026-01-15T14:00:00", { zone: EAT }).toISO()!;
    const next = getNextEvents({ nowISO, displayDate, displayZone: EAT, limit: 3 });

    expect(next.length).toBeGreaterThan(0);

    // sorted
    for (let i = 1; i < next.length; i++) {
      const prev = DateTime.fromISO(next[i - 1].atISO).toMillis();
      const cur = DateTime.fromISO(next[i].atISO).toMillis();
      expect(cur).toBeGreaterThanOrEqual(prev);
    }

    // first expected: NY open at 16:00 EAT
    const first = next[0];
    expect(first.kind).toBe("session_start");
    expect(first.label).toContain("New York opens");
    expect(DateTime.fromISO(first.atISO).setZone(EAT).toFormat("HH:mm")).toBe("16:00");
  });

  it("During DST overlap season (Apr 2026), overlap starts at 15:00 EAT", () => {
    const displayDate = "2026-04-15" as ISODate;

    // now: 14:30 EAT, next overlap start should be 15:00
    const nowISO = DateTime.fromISO("2026-04-15T14:30:00", { zone: EAT }).toISO()!;
    const next = getNextEvents({ nowISO, displayDate, displayZone: EAT, limit: 10 });

    const overlapStart = next.find(e => e.kind === "overlap_start");
    expect(overlapStart).toBeTruthy();
    expect(DateTime.fromISO(overlapStart!.atISO).setZone(EAT).toFormat("HH:mm")).toBe("15:00");
  });
});

