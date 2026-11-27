// A page ready for a capture press on Earth: past training, the biosphere scanned, the carriers made.
import type { AcquisitionVerbV1 } from '@cf/domain-acquisition';
import { createSessionRNG } from '@cf/domain-sessionrng';
import type { CanonicalCF1WorldAddress } from '@cf/scene';
import {
  captureCardModel, captureGateV1, captureSnapshotV1, settleCaptureV1, type CaptureActionOutcomeV1, type CaptureRosterSource,
} from '../src/capture';
import { canonicalWorldRoster } from '../src/world';
import { actionPage, type ActionPageOptions } from './action-support';
import { SOL, solWorld } from './landing-support';
import { NOW } from './save-support';

export const rosterFor: CaptureRosterSource = (address, epoch) => {
  const built = canonicalWorldRoster(address, epoch, null);
  return built.ok ? { ok: true, roster: built.roster } : { ok: false, reason: built.reason };
};
export const EARTH = solWorld(SOL.earth);
/** Earth's roster at epoch 0, a row a species. */
export const earthRows = (): readonly Readonly<Record<string, unknown>>[] => {
  const built = canonicalWorldRoster(EARTH, 0, null);
  if (!built.ok) throw new Error(built.reason);
  return built.roster.view.all;
};

/** A session seed whose nth success draw of a capture satisfies `wanted`. */
export function captureSession(wanted: (success: number, pick: number) => boolean): number {
  for (let seed = 1; seed < 2000; seed++) {
    const rng = createSessionRNG(seed);
    if (wanted(rng.at('capture.success', 0), rng.at('capture.candidate', 0))) return seed;
  }
  throw new Error('no session seed gives that capture');
}

export async function capturePage(options: ActionPageOptions & { readonly scanned?: readonly number[] } = {}) {
  const page = await actionPage({
    ...options,
    change: (state) => {
      state.surveyedSet = (options.scanned ?? [SOL.earth]) as unknown as string[];
      options.change?.(state);
    },
  });
  /** The snapshot the card is drawn from now. */
  const snapshot = (address: CanonicalCF1WorldAddress = EARTH) => {
    const composed = captureSnapshotV1({
      address, epoch: page.durable().EPOCH_BASE, activePlayMs: page.runtime.activePlayMs(), extensions: page.runtime.extensions, rosterFor,
    });
    if (composed.kind !== 'ready') throw new Error(`snapshot was ${composed.reason}`);
    return composed.snapshot;
  };
  const card = (address: CanonicalCF1WorldAddress = EARTH) =>
    captureCardModel(snapshot(address), captureGateV1(page.durable(), page.runtime.extensions, address));
  const press = (verb: AcquisitionVerbV1, address: CanonicalCF1WorldAddress = EARTH, shown?: string): Promise<CaptureActionOutcomeV1> =>
    settleCaptureV1(page.loop, { address, verb, shown: shown ?? card(address).fence ?? 'no-card', codecNow: NOW, rosterFor });
  return { ...page, snapshot, card, press };
}
export type CapturePage = Awaited<ReturnType<typeof capturePage>>;
