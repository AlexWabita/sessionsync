
import { DEFAULT_ALERTS_PREFS } from "./alerts";
import type { AlertsPrefs, AlertRule, AlertKind } from "./alerts";

const MIN_HORIZON = 1;
const MAX_HORIZON = 60;
const MAX_RULES = 50;

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function normalizeKinds(kinds: unknown): AlertKind[] {
  const allowed: AlertKind[] = ["session_open", "session_close", "overlap_start", "overlap_end"];
  if (!Array.isArray(kinds)) return DEFAULT_ALERTS_PREFS.kindsEnabled;
  const filtered = kinds.filter((k) => allowed.includes(k as AlertKind)) as AlertKind[];
  return filtered.length ? filtered : DEFAULT_ALERTS_PREFS.kindsEnabled;
}

function normalizeRules(rules: unknown): AlertRule[] {
  if (!Array.isArray(rules)) return [];
  const safe: AlertRule[] = [];
  for (const r of rules) {
    if (!r || typeof r !== "object") continue;
    const anyR = r as Record<string, unknown>;
    const id = typeof anyR.id === "string" && anyR.id ? anyR.id : "";
    const enabled = typeof anyR.enabled === "boolean" ? anyR.enabled : true;
    const kind = anyR.kind as AlertKind;
    const offsetMinutes =
      typeof anyR.offsetMinutes === "number" ? clampInt(anyR.offsetMinutes, 0, 24 * 60) : 0;
    const weekdaysOnly = typeof anyR.weekdaysOnly === "boolean" ? anyR.weekdaysOnly : true;

    const target = anyR.target;
let tgt: { type: "session"; sessionId: string } | { type: "overlap"; overlapId: string } | null = null;
    if (target && typeof target === "object") {
      const t = target;
      if ("type" in t && (t).type === "session" && "sessionId" in t && typeof (t).sessionId === "string") {
        tgt = { type: "session", sessionId: (t).sessionId };
      } else if ("type" in t && (t).type === "overlap" && "overlapId" in t && typeof (t).overlapId === "string") {
        tgt = { type: "overlap", overlapId: (t).overlapId };
      }
    }
const allowed: AlertKind[] = ["session_open", "session_close", "overlap_start", "overlap_end"];
    if (!id || !allowed.includes(kind) || !tgt) continue;

    safe.push({ id, enabled, kind, target: tgt, offsetMinutes, weekdaysOnly });
    if (safe.length >= MAX_RULES) break;
  }
  return safe;
}

/**
 * Backwards compatible "safe defaults + clamping" validator.
 * It NEVER throws; it returns a safe AlertsPrefs object.
 */
export function validateAlertsPrefs(input: unknown): AlertsPrefs {
  const base = DEFAULT_ALERTS_PREFS;

  if (!input || typeof input !== "object") {
    // In the old tests you expected enabled=false for null; we keep that behavior.
    return { ...base, enabled: false };
  }

  const obj = input as Record<string, unknown>;

  const enabled = typeof obj.enabled === "boolean" ? obj.enabled : base.enabled;
  const displayZone = typeof obj.displayZone === "string" && obj.displayZone ? obj.displayZone : base.displayZone;

  const horizonDaysRaw = typeof obj.horizonDays === "number" ? obj.horizonDays : base.horizonDays;
  const horizonDays = clampInt(horizonDaysRaw, MIN_HORIZON, MAX_HORIZON);

  const kindsEnabled = normalizeKinds(obj.kindsEnabled);
  const rules = normalizeRules(obj.rules);

  return { enabled, displayZone, horizonDays, kindsEnabled, rules };
}


