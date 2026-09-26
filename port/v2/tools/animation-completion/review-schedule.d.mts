export interface ReviewRow {
  id: string;
  startMs: number;
  endMs: number;
}
export interface FullRowSchedule {
  rows: ReviewRow[];
  durationMs: number;
}
/** Validates each positive finite action duration and includes transition margins. */
export function createFullRowSchedule(timelines: Readonly<Record<string, {readonly durationMs: number}>>): FullRowSchedule;
/** Returns the supplied encoded seconds after checking full declared coverage. */
export function requireFullRowMedia(seconds: number, durationMs: number): number;
