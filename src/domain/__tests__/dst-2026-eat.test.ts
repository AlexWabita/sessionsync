import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { getSessionBlock } from "../sessions/generateDaySchedule";
import type { ISODate } from "../time";

const EAT = "Africa/Nairobi";

function hhmmInEat(iso: string) {
  return DateTime.fromISO(iso).setZone(EAT).toFormat("HH:mm");
}

describe("DST correctness in EAT (2026)", () => {
  it("New York shifts when US DST starts (Mar 8, 2026)", () => {
    // Before US DST (standard time)
    const b = getSessionBlock({ sessionId: "newyork", displayDate: "2026-03-07" as ISODate, displayZone: EAT });
    expect(hhmmInEat(b.startISO)).toBe("16:00");
    expect(hhmmInEat(b.endISO)).toBe("01:00");

    // After US DST starts (EDT)
    const a = getSessionBlock({ sessionId: "newyork", displayDate: "2026-03-10" as ISODate, displayZone: EAT });
    expect(hhmmInEat(a.startISO)).toBe("15:00");
    expect(hhmmInEat(a.endISO)).toBe("00:00");
  });

  it("London shifts when UK DST starts (Mar 29, 2026)", () => {
    // Before UK DST (GMT)
    const b = getSessionBlock({ sessionId: "london", displayDate: "2026-03-28" as ISODate, displayZone: EAT });
    expect(hhmmInEat(b.startISO)).toBe("11:00");
    expect(hhmmInEat(b.endISO)).toBe("20:00");

    // After UK DST starts (BST)
    const a = getSessionBlock({ sessionId: "london", displayDate: "2026-03-30" as ISODate, displayZone: EAT });
    expect(hhmmInEat(a.startISO)).toBe("10:00");
    expect(hhmmInEat(a.endISO)).toBe("19:00");
  });

  it("Sydney shifts when AU DST ends (Apr 5, 2026)", () => {
    // Just before AU DST ends (AEDT)
    const b = getSessionBlock({ sessionId: "sydney", displayDate: "2026-04-04" as ISODate, displayZone: EAT });
    expect(hhmmInEat(b.startISO)).toBe("00:00");
    expect(hhmmInEat(b.endISO)).toBe("09:00");

    // After AU DST ends (AEST)
    const a = getSessionBlock({ sessionId: "sydney", displayDate: "2026-04-06" as ISODate, displayZone: EAT });
    expect(hhmmInEat(a.startISO)).toBe("01:00");
    expect(hhmmInEat(a.endISO)).toBe("10:00");
  });
});

