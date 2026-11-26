import type { NavState, ZoomMode } from '@cf/scene';

export type SizeClass = 'compact' | 'medium' | 'wide';
export type InputMode = 'touch' | 'mouse';
export type BootKind = 'fresh' | 'current' | 'recovered-protected' | 'future-protected'
  | 'corrupt-protected' | 'revision-exhausted-protected' | 'transient-protected';
export type WriteHold = false | 'transient-read' | 'protected-payload';
export type PersistState = 'kept' | 'not-kept' | 'unsupported' | 'unknown';

/** Every event the systems of the app send each other, by name, with its payload. */
export interface GameEvents {
  'save:boot': { kind: BootKind; hold: WriteHold; detail: string | null };
  'save:committed': { revision: number };
  'save:reload-required': { reason: string };
  /** Whether this page may store the expedition changed: it took the save, or no longer has it. */
  'save:authority': { writable: boolean };
  /** The page came under a write hold after its boot. */
  'save:held': { detail: string };
  /** A product action was stored with its receipt: `kind` names the action, `receiptOrdinal` its receipt. */
  'outcome:committed': { kind: string; receiptOrdinal: number };
  /** A product action was not stored: the page is held, owes a reload, is busy with another action, has no
   *  lease, or storage or the action's own rule refused it (`reason` is then the refusal's kind, followed by a
   *  colon and its own reason where it has one: `pre-draw-refused:capacity`). */
  'outcome:refused': { kind: string; reason: string };
  'settings:changed': { field: string };
  'nav:changed': { from: ZoomMode; to: ZoomMode; nav: NavState };
  'nav:refused': { reason: 'prime-reach' | 'charter-reach' | 'not-proven'; hint: string };
  'layout:size-class': { sizeClass: SizeClass; width: number; height: number };
  'input:mode': { mode: InputMode };
  'pack:status': { name: string; state: 'ready' | 'standin' | 'refused'; detail: string | null };
  /** A creature's picture showed a gap no picture had shown before: `key` is that creature's, `gap` the gap's words. */
  'creature:gap': { key: string; gap: string };
  'protect:persist': { state: PersistState };
  'protect:backup': { at: number };
}
