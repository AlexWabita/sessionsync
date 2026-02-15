
import { z } from "zod";

const AlertKindSchema = z.enum([
  "session_open",
  "session_close",
  "overlap_start",
  "overlap_end",
]);

const AlertTargetSchema = z.union([
  z.object({
    type: z.literal("session"),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("overlap"),
    overlapId: z.string().min(1),
  }),
]);

const AlertRuleSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  kind: AlertKindSchema,
  target: AlertTargetSchema,
  offsetMinutes: z.number().int().min(0).max(24 * 60),
  weekdaysOnly: z.boolean(),
});

export const AlertPrefsSchema = z.object({
  enabled: z.boolean(),
  displayZone: z.string().min(1), // validated as IANA elsewhere (we normalize on input)
  horizonDays: z.number().int().min(1).max(60),
  kindsEnabled: z.array(AlertKindSchema).min(1),
  rules: z.array(AlertRuleSchema),
});

