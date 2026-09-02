export interface InventoryActionOffscreenPrior {
  ok: boolean;
  saved: number;
  styleAttribute: string | null;
  transform: string;
  transformPriority: string;
}

export interface InventoryActionOffscreenTarget {
  ok: boolean;
  rect: number[] | null;
  x: number | null;
  y: number | null;
  hit: string | null;
  fullyOutside: boolean;
}

export interface InventoryActionOffscreenSetup {
  ok: boolean;
  mutationApplied: boolean;
  mode: 'scroll' | 'translated' | null;
  why?: string;
  saved?: number;
  top?: number;
  translated?: boolean;
  appliedTransform?: string;
  appliedTransformPriority?: string;
  scrollTarget?: InventoryActionOffscreenTarget;
  target: InventoryActionOffscreenTarget | null;
}

export interface InventoryActionOffscreenRestoration {
  ok: boolean;
  why?: string;
  mutationApplied?: boolean;
  ownerStable?: boolean;
  scrollTop?: number;
  styleAttribute?: string | null;
  styleAttributeRestored?: boolean;
  transform?: string;
  transformPriority?: string;
  styleRestored?: boolean;
}

export function prepareInventoryActionOffscreen(
  button: unknown,
  card: unknown,
  prior: InventoryActionOffscreenPrior,
  viewport: { width: number; height: number },
  hitTest: (x: number, y: number) => unknown,
): InventoryActionOffscreenSetup;

export function restoreInventoryActionOffscreen(
  button: unknown,
  card: unknown,
  prior: InventoryActionOffscreenPrior,
  mutationApplied?: boolean,
): InventoryActionOffscreenRestoration;

export function buildInventoryActionOffscreenRestoreSource(
  prior: InventoryActionOffscreenPrior,
  mutationApplied: boolean,
): string;

export function runInventoryOffscreenProbe<TProbe = unknown>(owners: {
  setup: () => InventoryActionOffscreenSetup | Promise<InventoryActionOffscreenSetup>;
  activate: () => TProbe | Promise<TProbe>;
  restore: (
    setup: InventoryActionOffscreenSetup | null,
    setupError: string | null,
  ) => InventoryActionOffscreenRestoration | Promise<InventoryActionOffscreenRestoration>;
}): Promise<{
  offscreenSetup: InventoryActionOffscreenSetup | null;
  offscreenProbe: TProbe | null;
  restored: InventoryActionOffscreenRestoration | null;
  setupError: string | null;
  probeError: string | null;
  restorationError: string | null;
  probeAttempted: boolean;
}>;
