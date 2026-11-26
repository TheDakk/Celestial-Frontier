/* The capture snapshot: the world's whole roster, the gear, the Compendium and the Yield as the save holds them,
   at one moment of active play. A press of Tame, Scavenge or Sample is judged against it; the card is drawn
   from it.

   LEGACY celestial-frontier.html, v1.8.9: the pool is the world's own species list, less what the Compendium
   already holds (`tryCapture` 14866-14867); the ring that resists (`_captureRing` 14815-14824); the worn contact
   gear that helps (`captureOdds` 14831); the Yield pool (`bioPool` 14852-14858). Those rules are
   `@cf/domain-acquisition`'s; this file only gathers what they read. The roster is the world system's, which a
   system folder may not import: the caller hands it in.

   Ported from the painted port's `acquisition-snapshot.ts`. Not carried: its checks of its own caller's input,
   and its second reading of the save to bind the two random values (the receipt hands them over). */
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER, type AcquisitionSnapshotV1 } from '@cf/domain-acquisition';
import { registerAcquisitionSnapshotV1 } from '@cf/domain-acquisition/snapshot-internal';
import { readArc2AcquisitionCapabilities, readArc4Ownership, readF4Authority, type V5Extensions } from '@cf/persistence';
import type { CanonicalCF1WorldAddress } from '@cf/scene';

/** The part of the world system's roster that capture reads. */
export interface CaptureWorldRoster {
  readonly address: CanonicalCF1WorldAddress;
  readonly worldKey: string;
  readonly biosphereKey: string;
  readonly ecologyEpoch: number;
  readonly fullRosterFingerprint: string;
  readonly view: Readonly<{ all: readonly Readonly<Record<string, unknown>>[] }>;
}
/** The world system's roster of a world at an epoch (`canonicalWorldRoster`). */
export type CaptureRosterSource = (address: CanonicalCF1WorldAddress, epoch: number) =>
  | Readonly<{ ok: true; roster: CaptureWorldRoster }>
  | Readonly<{ ok: false; reason: string }>;

export type CaptureSnapshotOutcome =
  | Readonly<{ kind: 'ready'; snapshot: AcquisitionSnapshotV1; roster: CaptureWorldRoster }>
  | Readonly<{ kind: 'refused'; reason: string }>;

/** The snapshot of this world at this epoch and this moment of active play, from these extensions. */
export function captureSnapshotV1(input: Readonly<{
  address: CanonicalCF1WorldAddress;
  epoch: number;
  activePlayMs: number;
  extensions: V5Extensions;
  rosterFor: CaptureRosterSource;
}>): CaptureSnapshotOutcome {
  const refused = (reason: string): CaptureSnapshotOutcome => Object.freeze({ kind: 'refused', reason });
  const { address, extensions } = input;
  const built = input.rosterFor(address, input.epoch);
  if (!built.ok) return refused(`roster:${built.reason}`);
  const { roster } = built;
  if (roster.worldKey !== address.key || roster.ecologyEpoch !== input.epoch) return refused('roster:another-world');
  const ownership = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') return refused(`ownership:${ownership.kind}`);
  if (ownership.state.mode !== 'current') return refused('ownership:protected');
  const gear = readArc2AcquisitionCapabilities(extensions);
  if (gear.kind !== 'loaded') return refused(`gear:${gear.kind}`);
  const authority = readF4Authority(extensions);
  if (authority.kind !== 'loaded') return refused(`session:${authority.kind}`);
  try {
    const snapshot = registerAcquisitionSnapshotV1({
      address,
      worldKey: address.key,
      ecologyEpoch: roster.ecologyEpoch,
      fullRosterFingerprint: roster.fullRosterFingerprint,
      biosphereKey: roster.biosphereKey,
      rosterRows: roster.view.all,
      capabilities: gear.capabilities,
      ownership: ownership.state,
      f4Authority: { activePlayMs: input.activePlayMs, sessionRng: authority.authority.sessionRng },
    });
    return Object.freeze({ kind: 'ready', snapshot, roster });
  } catch (error) {
    return refused(`snapshot:${error instanceof Error ? error.message : String(error)}`);
  }
}
