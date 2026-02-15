import { z } from "zod";
import { assertHHmm } from "../time/tz";
import { AlertPrefsSchema } from "@/domain/prefs/alerts.validation";
import type { UserPrefs } from "../prefs/types";

const HHmmSchema = z.string().refine((v) => {
  try { assertHHmm(v); return true; } catch { return false; }
}, { message: "Expected HH:mm" });

export const ZoneIdSchema = z.string().min(1);

// Keep SessionId strict (core four for v1)
export const SessionIdSchema = z.enum(["sydney", "tokyo", "london", "newyork"]);

// Event kinds strict
export const EventKindSchema = z.enum(["session_start","session_end","overlap_start","overlap_end"]);

export const QuietHoursSchema = z.object({
  enabled: z.boolean(),
  startHHmm: HHmmSchema,
  endHHmm: HHmmSchema,
});

export const UserPrefsSchema = z.object({
  version: z.literal(1),
  displayZone: ZoneIdSchema,
  pinnedClocks: z.array(ZoneIdSchema).min(1),
  enabledSessions: z.array(SessionIdSchema).min(1),
  alerts: AlertPrefsSchema,
}) satisfies z.ZodType<UserPrefs>;

export function parseUserPrefs(input: unknown): UserPrefs {
  return UserPrefsSchema.parse(input);
}


