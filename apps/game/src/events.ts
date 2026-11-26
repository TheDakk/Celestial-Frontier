import type { SceneRoute } from '@cf/domain-landing';
import type { CanonicalCF1StarAddress, CanonicalCF1WorldAddress, NavState, ZoomMode } from '@cf/scene';

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
   *  colon and its own reason where it has one: `pre-draw-refused:capacity`, `declined:current`). */
  'outcome:refused': { kind: string; reason: string };
  /** A landing is stored: the explorer stands on the world, in the region this landing rolled, shown by `route`.
   *  `firstLanding`: the world was never stood on before. A wave-off says nothing here. */
  'landing:arrived': { address: CanonicalCF1WorldAddress; regionKey: string | null; route: SceneRoute; firstLanding: boolean };
  /** A survey of a star or a world is stored: something it showed was new to the expedition's record. */
  'survey:done': { address: CanonicalCF1StarAddress | CanonicalCF1WorldAddress };
  /** A product carrier of the save could not be read or made at boot; said at every boot while it is so. */
  'save:carrier-refused': { carrier: string; reason: string };
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
