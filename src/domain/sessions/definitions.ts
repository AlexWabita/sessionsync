import type { SessionDefinition } from "./types";

/**
 * Canonical session definitions in VENUE-LOCAL time.
 * These align with widely used FX session conventions:
 * - Sydney: 08:00–17:00 (Australia/Sydney)
 * - Tokyo: 09:00–18:00 (Asia/Tokyo)
 * - London: 08:00–17:00 (Europe/London)
 * - New York: 08:00–17:00 (America/New_York)
 *
 * DST is handled automatically by each venue zone.
 */
export const SESSION_DEFS: readonly SessionDefinition[] = [
  {
    id: "sydney",
    label: "Sydney",
    venueZone: "Australia/Sydney",
    localStart: "08:00",
    localEnd: "17:00",
  },
  {
    id: "tokyo",
    label: "Tokyo",
    venueZone: "Asia/Tokyo",
    localStart: "09:00",
    localEnd: "18:00",
  },
  {
    id: "london",
    label: "London",
    venueZone: "Europe/London",
    localStart: "08:00",
    localEnd: "17:00",
  },
  {
    id: "newyork",
    label: "New York",
    venueZone: "America/New_York",
    localStart: "08:00",
    localEnd: "17:00",
  },
] as const;
