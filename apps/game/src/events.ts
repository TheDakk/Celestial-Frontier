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
  'settings:changed': { field: string };
  'nav:changed': { from: ZoomMode; to: ZoomMode; nav: NavState };
  'nav:refused': { reason: 'prime-reach' | 'charter-reach' | 'not-proven'; hint: string };
  'layout:size-class': { sizeClass: SizeClass; width: number; height: number };
  'input:mode': { mode: InputMode };
  'pack:status': { name: string; state: 'ready' | 'standin' | 'refused'; detail: string | null };
  'protect:persist': { state: PersistState };
  'protect:backup': { at: number };
}
