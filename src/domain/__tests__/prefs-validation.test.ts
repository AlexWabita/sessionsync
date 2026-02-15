
import { describe, it, expect } from "vitest";
import { DEFAULT_PREFS } from "@/domain/prefs";
import { parseUserPrefs } from "@/domain/validation/prefs";

describe("UserPrefs validation", () => {
  it("DEFAULT_PREFS is valid", () => {
    expect(() => parseUserPrefs(DEFAULT_PREFS)).not.toThrow();
  });

  it("Rejects empty pinned clocks", () => {
    const bad = {
      ...DEFAULT_PREFS,
      pinnedClocks: [],
    };
    expect(() => parseUserPrefs(bad)).toThrow();
  });

  it("Rejects invalid alert kind", () => {
    const bad = {
      ...DEFAULT_PREFS,
      alerts: {
        ...DEFAULT_PREFS.alerts,
        kindsEnabled: ["session_start"], // invalid in new contract
      },
    };
    expect(() => parseUserPrefs(bad)).toThrow();
  });

  it("Rejects horizonDays outside range", () => {
    const bad = {
      ...DEFAULT_PREFS,
      alerts: {
        ...DEFAULT_PREFS.alerts,
        horizonDays: 0,
      },
    };
    expect(() => parseUserPrefs(bad)).toThrow();
  });
});

