/** @module expedition-reset [app] — Settings → Reset expedition (v1.8.9 parity, D16; v1 `resetbtn` → `resetconfirm` →
 * `resetyes` → `wipeSaveAndReload`). v1 deleted the save key and rebuilt the opening expedition. v2 never deletes rows by
 * hand: the reset is an ordinary audited REPLACEMENT (the same `importBlob` transaction a save import uses, which clears the
 * old expedition's receipts in the same write and reloads), whose payload is exactly the state a brand-new explorer boots
 * with — `importSaveV2('{}')`, Field Training not done, the route parked at Sol (loadSave's fresh branch). No save shape
 * changes: the payload is the canonical legacy export of that fresh state. Device preferences (localStorage) are untouched. */
import { exportSaveV2, importSaveV2, type ContentRegistry } from '@cf/persistence';

export function freshExpeditionPayloadV1(input: Readonly<{ registry: ContentRegistry; now: number; solView: unknown }>): string {
  const fresh = importSaveV2('{}', input.registry, input.now);
  if (!fresh.ok) throw new Error('fresh expedition construction failed');
  fresh.state.tutDone = false;
  if (input.solView !== null && input.solView !== undefined) {
    fresh.state.savedView = input.solView as typeof fresh.state.savedView;
  }
  return exportSaveV2(fresh.state, input.now);
}
