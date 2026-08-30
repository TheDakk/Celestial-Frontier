/* Orbital-approach presentation owner for the already-defined generic
   distant-ecology audio seam. It projects only a current canonical world's
   biosphere-level evidence and never exposes, filters, or mutates roster rows.
   Playback is constructed only inside an explicit Listen click after the
   exact current visual lead has been proven live. */
import type { AudioCounterpartReceipt } from '@cf/audio';
import {
  createCurrentWorldApproachDistantEcologyPlaybackV1,
  type CurrentWorldApproachEcologyVisualReceiptV1,
  type CurrentWorldDistantEcologyPlaybackV1,
} from './biome-ecology-audio.js';
import {
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';

export const APPROACH_ECOLOGY_READ_MODEL_SCHEMA =
  'cf-v2-approach-ecology-read-model/v1' as const;

export type ApproachEcologyAvailability = 'ready' | 'silent-world' | 'protected';

export interface ApproachEcologySurfaceReceiptV1 {
  readonly generation: number;
  readonly worldKey: string | null;
  readonly environmentFingerprint: string | null;
  readonly biosphereKey: string | null;
  readonly ecologyEpoch: number;
  readonly surface: 'approach';
  readonly surfaceKey: string;
}

export interface ApproachEcologyReadModelV1 {
  readonly schema: typeof APPROACH_ECOLOGY_READ_MODEL_SCHEMA;
  readonly surface: ApproachEcologySurfaceReceiptV1;
  readonly availability: ApproachEcologyAvailability;
  readonly detail: string;
}

export interface ApproachEcologyProjectionInputV1 {
  readonly generation: number;
  readonly ecologyEpoch: number;
  readonly roster: CanonicalWorldRoster | null;
}

export type ApproachEcologyPlayResultV1 =
  | Readonly<{ readonly kind: 'started'; readonly voiceId: string }>
  | Readonly<{ readonly kind: 'silent'; readonly reason: string }>;

export interface ApproachEcologyControllerOptions {
  readonly root: HTMLElement;
  readonly isCurrent: (surface: ApproachEcologySurfaceReceiptV1) => boolean;
  /** Invoked only from the browser's trusted native Listen click stack. */
  readonly onNativeListenGesture?: () => void;
  /** Invoked only after the exact polite/atomic counterpart is painted. */
  readonly onListen?: (
    playback: CurrentWorldDistantEcologyPlaybackV1,
    counterpart: AudioCounterpartReceipt,
  ) => void;
}

const READ_MODELS = new WeakSet<object>();
const MODEL_ROSTERS = new WeakMap<object, CanonicalWorldRoster>();

function checkedNonNegativeSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
  return value as number;
}

function checkedPositiveGeneration(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new RangeError('approach generation must be a positive safe integer');
  }
  return value as number;
}

function surfaceReceipt(
  generation: number,
  ecologyEpoch: number,
  roster: CanonicalWorldRoster | null,
): ApproachEcologySurfaceReceiptV1 {
  const worldKey = roster?.worldKey ?? null;
  const environmentFingerprint = roster?.environmentFingerprint ?? null;
  const biosphereKey = roster?.biosphereKey ?? null;
  return Object.freeze({
    generation,
    worldKey,
    environmentFingerprint,
    biosphereKey,
    ecologyEpoch,
    surface: 'approach' as const,
    surfaceKey: JSON.stringify([
      generation,
      worldKey,
      environmentFingerprint,
      biosphereKey,
      ecologyEpoch,
      'approach',
    ]),
  });
}

/** Project one already-proven canonical world into a generic approach lead.
 * The model contains no kingdom, family, identity, row, reward, or writer. */
export function projectApproachEcologyAudioV1(
  input: ApproachEcologyProjectionInputV1,
): ApproachEcologyReadModelV1 {
  const generation = checkedPositiveGeneration(input?.generation);
  const ecologyEpoch = checkedNonNegativeSafeInteger(input?.ecologyEpoch, 'ecology epoch');
  const roster = input?.roster ?? null;
  const canonical = roster !== null && isCanonicalWorldRoster(roster)
    && roster.ecologyEpoch === ecologyEpoch;
  const surface = surfaceReceipt(generation, ecologyEpoch, canonical ? roster : null);
  const availability: ApproachEcologyAvailability = !canonical
    ? 'protected'
    : roster.biosphereKey === 'none'
      ? 'silent-world'
      : 'ready';
  const detail = availability === 'ready'
    ? 'Orbital approach instruments detect a living biosphere.'
    : availability === 'silent-world'
      ? 'Orbital approach instruments detect no living biosphere.'
      : 'Orbital biosphere telemetry is currently protected.';
  const model: ApproachEcologyReadModelV1 = Object.freeze({
    schema: APPROACH_ECOLOGY_READ_MODEL_SCHEMA,
    surface,
    availability,
    detail,
  });
  READ_MODELS.add(model);
  if (canonical) MODEL_ROSTERS.set(model, roster);
  return model;
}

export class ApproachEcologyController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #isCurrent: ApproachEcologyControllerOptions['isCurrent'];
  readonly #onNativeListenGesture: ApproachEcologyControllerOptions['onNativeListenGesture'];
  readonly #onListen: ApproachEcologyControllerOptions['onListen'];
  #mount: HTMLElement | null = null;
  #state: ApproachEcologyReadModelV1 | null = null;
  #activePlayback: CurrentWorldDistantEcologyPlaybackV1 | null = null;
  #lastResult: ApproachEcologyPlayResultV1 | null = null;
  #listenerInstalled = false;
  #disposed = false;

  constructor(options: ApproachEcologyControllerOptions) {
    if (!options?.root || typeof options.isCurrent !== 'function') {
      throw new TypeError('approach ecology controller requires root/current owners');
    }
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#isCurrent = options.isCurrent;
    this.#onNativeListenGesture = options.onNativeListenGesture;
    this.#onListen = options.onListen;
  }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#root.contains(mount)) throw new Error('approach ecology mount must belong to root');
    if (this.#mount && this.#mount !== mount) this.#mount.replaceChildren();
    this.#mount = mount;
    this.#activePlayback = null;
    this.#lastResult = null;
    this.#installListener();
    this.#render();
  }

  detach(): void {
    if (this.#disposed) return;
    this.#removeListener();
    this.#mount?.replaceChildren();
    this.#mount = null;
    this.#activePlayback = null;
    this.#lastResult = null;
  }

  setState(state: ApproachEcologyReadModelV1 | null): void {
    this.#assertLive();
    if (state !== null && !READ_MODELS.has(state)) {
      throw new TypeError('approach ecology state must come from its projector');
    }
    if (state?.surface.surfaceKey !== this.#state?.surface.surfaceKey) {
      this.#activePlayback = null;
      this.#lastResult = null;
    }
    this.#state = state;
    this.#render();
  }

  refresh(): void {
    this.#assertLive();
    this.#render();
  }

  cancel(): void {
    if (this.#disposed) return;
    this.#activePlayback = null;
    this.#lastResult = null;
    this.#render();
  }

  settle(
    playback: CurrentWorldDistantEcologyPlaybackV1,
    result: ApproachEcologyPlayResultV1,
  ): void {
    this.#assertLive();
    if (playback !== this.#activePlayback) return;
    this.#lastResult = Object.freeze({ ...result });
    this.#render();
  }

  counterpartIsCurrent(receipt: AudioCounterpartReceipt): boolean {
    const playback = this.#activePlayback;
    const status = this.#mount?.querySelector<HTMLElement>(
      '[data-arc8-approach-ecology-status]',
    ) ?? null;
    if (playback === null || status === null) return false;
    return receipt.counterpartKey === playback.counterpart.counterpartKey
      && receipt.eventKey === playback.counterpart.eventKey
      && receipt.generation === playback.counterpart.generation
      && this.#rootVisible()
      && this.#surfaceIsCurrent()
      && status.isConnected
      && !status.hidden
      && status.closest('[hidden],[inert]') === null
      && status.getAttribute('role') === 'status'
      && status.getAttribute('aria-live') === 'polite'
      && status.getAttribute('aria-atomic') === 'true'
      && status.dataset.arc8ApproachEcologyEvent === playback.eventKey;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.detach();
    this.#state = null;
    this.#disposed = true;
  }

  #installListener(): void {
    if (this.#listenerInstalled) return;
    this.#root.addEventListener('click', this.#onClick);
    this.#listenerInstalled = true;
  }

  #removeListener(): void {
    if (!this.#listenerInstalled) return;
    this.#root.removeEventListener('click', this.#onClick);
    this.#listenerInstalled = false;
  }

  readonly #onClick = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-arc8-approach-ecology-listen]');
    if (!button || !this.#leadIsCurrent(button)) return;
    const state = this.#state!;
    const roster = MODEL_ROSTERS.get(state);
    if (!roster || state.surface.worldKey === null
      || state.surface.environmentFingerprint === null
      || state.surface.biosphereKey === null) return;
    let playback: CurrentWorldDistantEcologyPlaybackV1;
    try {
      const visual: CurrentWorldApproachEcologyVisualReceiptV1 = Object.freeze({
        generation: state.surface.generation,
        worldKey: state.surface.worldKey,
        environmentFingerprint: state.surface.environmentFingerprint,
        biosphereKey: state.surface.biosphereKey,
        granularity: 'biosphere',
        surface: 'approach',
        visible: true,
      });
      playback = createCurrentWorldApproachDistantEcologyPlaybackV1(roster, visual);
    } catch {
      return;
    }
    this.#activePlayback = playback;
    this.#lastResult = null;
    this.#render();
    const counterpart = playback.counterpart;
    if (!this.counterpartIsCurrent(counterpart)) return;
    if (event.isTrusted) this.#onNativeListenGesture?.();
    this.#onListen?.(playback, counterpart);
  };

  #render(): void {
    const mount = this.#mount;
    if (mount === null) return;
    if (!this.#rootVisible()) { this.detach(); return; }
    const fragment = this.#document.createDocumentFragment();
    const heading = this.#document.createElement('h4');
    heading.textContent = 'Biosphere signal';
    fragment.append(heading);
    const detail = this.#document.createElement('p');
    detail.className = 'muted';
    detail.dataset.arc8ApproachEcologyState = this.#state?.availability ?? 'absent';
    detail.textContent = this.#state?.detail ?? 'Orbital biosphere telemetry is unavailable.';
    fragment.append(detail);
    if (this.#state?.availability === 'ready') {
      const button = this.#document.createElement('button');
      button.type = 'button';
      button.className = 'ghost';
      button.style.minHeight = '44px';
      button.dataset.arc8ApproachEcologyListen = 'true';
      button.textContent = 'Listen to biosphere';
      button.disabled = !this.#surfaceIsCurrent() || this.#onListen === undefined;
      button.setAttribute('aria-disabled', String(button.disabled));
      fragment.append(button);
    }
    const status = this.#document.createElement('p');
    status.className = 'muted';
    status.dataset.arc8ApproachEcologyStatus = 'true';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const active = this.#activePlayback;
    status.hidden = active === null;
    if (active !== null) {
      status.dataset.arc8ApproachEcologyEvent = active.eventKey;
      status.textContent = this.#lastResult === null
        ? 'Listening to the biosphere signal.'
        : this.#lastResult.kind === 'started'
          ? 'Playing the biosphere signal.'
          : `Biosphere signal unavailable: ${this.#lastResult.reason}.`;
    }
    fragment.append(status);
    mount.replaceChildren(fragment);
    mount.dataset.arc8ApproachEcologyController = 'v1';
  }

  #canInteract(): boolean {
    return !this.#disposed && this.#mount !== null && this.#state?.availability === 'ready'
      && this.#rootVisible() && this.#surfaceIsCurrent();
  }

  #leadIsCurrent(button: HTMLButtonElement): boolean {
    const style = this.#document.defaultView?.getComputedStyle(button);
    return !button.disabled && button.isConnected && this.#mount?.contains(button) === true
      && button.closest('[hidden],[inert]') === null
      && button.dataset.arc8ApproachEcologyListen === 'true'
      && style?.display !== 'none' && style?.visibility !== 'hidden'
      && this.#surfaceIsCurrent();
  }

  #rootVisible(): boolean {
    const style = this.#document.defaultView?.getComputedStyle(this.#root);
    return this.#root.isConnected && !this.#root.hidden
      && this.#root.closest('[hidden],[inert]') === null
      && style?.display !== 'none' && style?.visibility !== 'hidden';
  }

  #surfaceIsCurrent(): boolean {
    const surface = this.#state?.surface;
    if (!surface) return false;
    try { return this.#isCurrent(surface) === true; } catch { return false; }
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error('approach ecology controller is disposed');
  }
}
