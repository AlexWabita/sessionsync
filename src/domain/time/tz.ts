import { DateTime } from "luxon";
import type { ISODate, ZoneId, HHmm } from "./types";

export function assertISODate(value: string): asserts value is ISODate {
  // strict YYYY-MM-DD (no Date parsing here)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ISODate: "${value}". Expected YYYY-MM-DD.`);
  }
}

export function assertHHmm(value: string): asserts value is HHmm {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`Invalid HHmm: "${value}". Expected HH:mm.`);
  }
  const [h, m] = value.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid HHmm: "${value}". Out of range.`);
  }
}

/**
 * Build a Luxon DateTime at (dateISO + timeHHmm) in the specified IANA zone.
 * DST is handled by Luxon/Intl.
 */
export function atLocalTime(dateISO: ISODate, timeHHmm: HHmm, zone: ZoneId): DateTime {
  assertISODate(dateISO);
  assertHHmm(timeHHmm);

  const [hour, minute] = timeHHmm.split(":").map(Number);
  const dt = DateTime.fromISO(dateISO, { zone }).set({ hour, minute, second: 0, millisecond: 0 });

  if (!dt.isValid) {
    throw new Error(`Invalid DateTime for ${dateISO} ${timeHHmm} in zone "${zone}": ${dt.invalidReason ?? "unknown"}`);
  }
  return dt;
}

export function dayStart(dateISO: ISODate, zone: ZoneId): DateTime {
  assertISODate(dateISO);
  const dt = DateTime.fromISO(dateISO, { zone }).startOf("day");
  if (!dt.isValid) throw new Error(`Invalid dayStart for ${dateISO} in zone "${zone}"`);
  return dt;
}

/**
 * Midday is used to map a display date -> venue date reliably (avoids midnight boundary issues).
 */
export function midday(dateISO: ISODate, zone: ZoneId): DateTime {
  assertISODate(dateISO);
  const dt = DateTime.fromISO(dateISO, { zone }).set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (!dt.isValid) throw new Error(`Invalid midday for ${dateISO} in zone "${zone}"`);
  return dt;
}

export function toISODate(dt: DateTime): ISODate {
  const iso = dt.toISODate();
  if (!iso) throw new Error("DateTime.toISODate() returned null");
  assertISODate(iso);
  return iso;
}

export function formatHHmm(dt: DateTime): string {
  return dt.toFormat("HH:mm");
}
