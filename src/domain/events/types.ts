export type EventKind =
  | "session_start"
  | "session_end"
  | "overlap_start"
  | "overlap_end";

export interface DomainEvent {
  kind: EventKind;
  label: string;

  // event instant
  atISO: string;

  // timeline convenience (relative to display day start)
  atMinute: number;

  meta?: Record<string, string>;
}
