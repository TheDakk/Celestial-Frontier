/* Reset expedition: the stored expedition is replaced by the one a brand-new explorer boots with.

   No row is deleted by hand. The reset is an ordinary whole-expedition replacement, so the old expedition's
   receipts go in the same write, and the page then reloads. Device preferences are not part of the save and
   are not touched. */
import { exportPortableV5Save, importSaveV2, prepareV5Replacement, type ContentRegistry } from '@cf/persistence';
import type { Clocks } from '../platform/clock';
import type { WriteGate } from './hold';
import type { SaveRuntime } from './runtime';

/** The portable payload of the state a brand-new explorer boots with. */
export function freshExpeditionPortable(input: {
  registry: ContentRegistry;
  wallNow: number;
  /** The Sol route a new expedition is parked at. */
  solView: Record<string, unknown> | null;
}): string {
  const fresh = importSaveV2('{}', input.registry, input.wallNow);
  if (!fresh.ok) throw new Error('fresh expedition construction failed');
  fresh.state.tutDone = false;
  if (input.solView !== null) fresh.state.savedView = input.solView;
  return exportPortableV5Save({ state: fresh.state, extensions: {} }, input.registry, input.wallNow);
}

/** Stores a whole-expedition replacement and reloads. `refused`: nothing was replaced. A refusal after the
 *  write was tried means this page can no longer prove the save is its own; the hold is tightened and only
 *  a reload clears it. Under any hold nothing is tried. */
export async function replaceExpedition(
  deps: {
    runtime: SaveRuntime;
    gate: WriteGate;
    /** Resolves when no ordinary checkpoint is running or waiting, so none races the replacement. */
    settle(): Promise<void>;
    reload(): void;
  },
  operations: Parameters<SaveRuntime['replace']>[0],
): Promise<boolean> {
  const { runtime, gate } = deps;
  await deps.settle();
  if (!gate.mayWrite()) return false;
  let kind: string;
  try {
    kind = (await runtime.replace(operations)).kind;
  } catch {
    // Storage failed and nothing was stored. The page keeps its place unless the runtime gave it up.
    if (runtime.diagnostics().staleBlocked) gate.protect('replacement authority lost; reload required');
    return false;
  }
  if (kind === 'lease-unavailable') return false;
  if (kind !== 'committed') {
    gate.protect(`replacement authority ${kind}; reload required`);
    runtime.setAnswerable(false);
    return false;
  }
  // The reloaded page takes the lease at once only if this one has given it up.
  await runtime.release().catch(() => undefined);
  deps.reload();
  return true;
}

export async function resetExpedition(deps: {
  runtime: SaveRuntime;
  gate: WriteGate;
  registry: ContentRegistry;
  clocks: Clocks;
  solView: Record<string, unknown> | null;
  settle(): Promise<void>;
  reload(): void;
}): Promise<'reset' | 'refused'> {
  const wallNow = deps.clocks.wallNow();
  const prepared = prepareV5Replacement(
    freshExpeditionPortable({ registry: deps.registry, wallNow, solView: deps.solView }), deps.registry, wallNow,
  );
  if (prepared.kind !== 'prepared') return 'refused';
  return await replaceExpedition(deps, prepared.operations) ? 'reset' : 'refused';
}
