
import { describe, it, expect } from "vitest";
import { validateAlertsPrefs } from "@/domain/prefs/alerts.sanitize";

describe("prefs: alerts validation", () => {
  it("defaults safely", () => {
    const a = validateAlertsPrefs(null);
    expect(a.enabled).toBe(false);
    expect(a.horizonDays).toBeGreaterThanOrEqual(1);
    expect(a.displayZone).toBeTruthy();
    expect(a.kindsEnabled.length).toBeGreaterThan(0);
  });

  it("clamps horizon days", () => {
    const a = validateAlertsPrefs({
      enabled: true,
      displayZone: "Africa/Nairobi",
      horizonDays: 999,
      kindsEnabled: ["session_open"],
      rules: [],
    });
    expect(a.horizonDays).toBe(60);
  });

  it("caps rule count", () => {
    const rules = Array.from({ length: 999 }).map((_, i) => ({
      id: "r" + i,
      enabled: true,
      kind: "session_open",
      target: { type: "session", sessionId: "tokyo" },
      offsetMinutes: 0,
      weekdaysOnly: true,
    }));
    const a = validateAlertsPrefs({
      enabled: true,
      displayZone: "Africa/Nairobi",
      horizonDays: 7,
      kindsEnabled: ["session_open"],
      rules,
    });
    expect(a.rules.length).toBe(50);
  });
});

