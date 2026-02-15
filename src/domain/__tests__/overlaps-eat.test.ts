import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { getSessionBlock } from "../sessions/generateDaySchedule";
import { makeOverlapBlock } from "../overlaps/overlap";
import type { ISODate } from "../time";

const EAT = "Africa/Nairobi";

function hhmmInEat(iso: string) {
  return DateTime.fromISO(iso).setZone(EAT).toFormat("HH:mm");
}

describe("Overlaps (EAT)", () => {
  it("London–NY overlap in standard-time regime (Jan 2026): 16:00–20:00 EAT", () => {
    const date = "2026-01-15" as ISODate;

    const london = getSessionBlock({ sessionId: "london", displayDate: date, displayZone: EAT });
    const ny = getSessionBlock({ sessionId: "newyork", displayDate: date, displayZone: EAT });

    const ov = makeOverlapBlock({
      a: { ...london, label: "London" },
      b: { ...ny, label: "New York" },
      label: "London–NY Overlap",
    });

    expect(ov).not.toBeNull();
    expect(hhmmInEat(ov!.startISO)).toBe("16:00");
    expect(hhmmInEat(ov!.endISO)).toBe("20:00");
  });

  it("London–NY overlap when both are in DST (Apr 2026): 15:00–19:00 EAT", () => {
    const date = "2026-04-15" as ISODate;

    const london = getSessionBlock({ sessionId: "london", displayDate: date, displayZone: EAT });
    const ny = getSessionBlock({ sessionId: "newyork", displayDate: date, displayZone: EAT });

    const ov = makeOverlapBlock({
      a: { ...london, label: "London" },
      b: { ...ny, label: "New York" },
      label: "London–NY Overlap",
    });

    expect(ov).not.toBeNull();
    expect(hhmmInEat(ov!.startISO)).toBe("15:00");
    expect(hhmmInEat(ov!.endISO)).toBe("19:00");
  });

  it("Overlap uses minutes timeline consistently (endMinute > startMinute)", () => {
    const date = "2026-04-15" as ISODate;
    const london = getSessionBlock({ sessionId: "london", displayDate: date, displayZone: EAT });
    const ny = getSessionBlock({ sessionId: "newyork", displayDate: date, displayZone: EAT });

    const ov = makeOverlapBlock({
      a: { ...london, label: "London" },
      b: { ...ny, label: "New York" },
      label: "London–NY Overlap",
    });

    expect(ov).not.toBeNull();
    expect(ov!.endMinute).toBeGreaterThan(ov!.startMinute);
  });
});
