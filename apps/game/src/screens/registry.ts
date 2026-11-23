import type { Bus } from '../bus';
import type { GameEvents, InputMode, SizeClass } from '../events';
import type { IconName } from '../ui';

/** What every screen is handed when it is shown. */
export interface ScreenContext {
  readonly bus: Bus<GameEvents>;
  sizeClass(): SizeClass;
  inputMode(): InputMode;
}

export interface ScreenDef {
  readonly id: string;
  /** Listed in the dock when present, and shown as a panel. A screen without one is drawn on the stage. */
  readonly dock?: { icon: IconName; label: string };
  /** The heading of a docked screen, drawn in the header of its panel, which stays while the panel scrolls. */
  title?(): HTMLElement;
  /** Draws the screen into `root`; returns the function that takes it away. */
  mount(root: HTMLElement, ctx: ScreenContext): () => void;
  /** States the layout check draws: `setup` runs before the mount it prepares. */
  readonly fixtures: readonly { id: string; setup(ctx: ScreenContext): void }[];
}

export interface ScreenRegistry {
  /** Throws when the id is already taken. */
  registerScreen(def: ScreenDef): void;
  /** In the order registered. */
  screens(): readonly ScreenDef[];
}

export function createScreenRegistry(): ScreenRegistry {
  const defs: ScreenDef[] = [];
  return {
    registerScreen(def) {
      if (defs.some((d) => d.id === def.id)) throw new Error(`screen ${def.id} is already registered`);
      defs.push(def);
    },
    screens: () => [...defs],
  };
}
