import { DateTime } from "luxon";
import type { Interval, OverlapBlock } from "./types";

/**
 * Compute the overlap of two intervals expressed in the SAME reference timeline
 * (same display date baseline).
 *
 * Returns null if no overlap.
 */
export function overlapInterval(a: Interval, b: Interval): Interval | null {
  const startMinute = Math.max(a.startMinute, b.startMinute);
  const endMinute = Math.min(a.endMinute, b.endMinute);
  if (endMinute <= startMinute) return null;

  // For ISO instants, choose the later start and earlier end based on actual instants.
  const aStart = DateTime.fromISO(a.startISO);
  const bStart = DateTime.fromISO(b.startISO);
  const aEnd = DateTime.fromISO(a.endISO);
  const bEnd = DateTime.fromISO(b.endISO);

  const startISO = (aStart >= bStart ? aStart : bStart).toISO();
  const endISO = (aEnd <= bEnd ? aEnd : bEnd).toISO();

  if (!startISO || !endISO) throw new Error("Overlap ISO conversion failed");

  return { startMinute, endMinute, startISO, endISO };
}

export function makeOverlapBlock(params: {
  a: Interval & { label: string };
  b: Interval & { label: string };
  label: string;
}): OverlapBlock | null {
  const { a, b, label } = params;
  const ov = overlapInterval(a, b);
  if (!ov) return null;
  return {
    ...ov,
    label,
    aLabel: a.label,
    bLabel: b.label,
  };
}
