export interface Interval {
  startMinute: number;
  endMinute: number;
  startISO: string;
  endISO: string;
}

export interface OverlapBlock extends Interval {
  label: string;
  aLabel: string;
  bLabel: string;
}
