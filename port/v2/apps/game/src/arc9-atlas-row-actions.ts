/* Arc 9 durable Star Atlas Home, Remove and one-level Undo owners.

   These actions reuse the established Favorite transaction discipline: one
   detached F4 parent, one immutable receipt, one CAS, no RNG, no retry, no
   optimistic publication, and read-only reload convergence after any durable
   ambiguity. Home changes only `homeId`. Remove splices one exact row and
   clears Home iff that row owned it; every surviving pair/entry remains in
   order so Main's entry-keyed route WeakMap stays valid. Undo restores the
   exact retained pair at its original index only against Remove's immutable
   current-successor receipt; its eight-second UI lifetime and route presence
   remain Main-owned ephemeral gates. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import type { SaveStateV2 } from '@cf/persistence';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';
import {
  detachStarAtlasDataV1,
  exactStarAtlasIdV1,
  inspectStarAtlasStateV1,
  sameStarAtlasJsonV1,
  starAtlasPlainRecordV1,
  StarAtlasStateProtectionV1,
  writableStarAtlasDataV1,
  type CheckedStarAtlasStateV1,
  type StarAtlasStateProtectionReasonV1,
} from './star-atlas-state.js';

export const ARC9_ATLAS_HOME_RECEIPT_KIND_V1 = 'arc9-atlas-home-v1' as const;
export const ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1 = 'arc9-atlas-remove-v1' as const;
export const ARC9_ATLAS_UNDO_RECEIPT_KIND_V1 = 'arc9-atlas-undo-v1' as const;
export const ARC9_ATLAS_DELETE_RECEIPT_SCHEMA_V1 =
  'cf-v2-arc9-atlas-delete-receipt/v1' as const;
export const ARC9_ATLAS_HOME_WITNESS_SCHEMA_V1 =
  'cf-v2-arc9-atlas-home-witness/v1' as const;
export const ARC9_ATLAS_REMOVE_WITNESS_SCHEMA_V1 =
  'cf-v2-arc9-atlas-remove-witness/v1' as const;
export const ARC9_ATLAS_UNDO_WITNESS_SCHEMA_V1 =
  'cf-v2-arc9-atlas-undo-witness/v1' as const;
const HOME_OPERATION_PREFIX = 'arc9.atlas-home:';
const REMOVE_OPERATION_PREFIX = 'arc9.atlas-remove:';
const UNDO_OPERATION_PREFIX = 'arc9.atlas-undo:';

export type Arc9AtlasRowActionProtectionReasonV1 =
  | 'atlas-id-shape'
  | 'desired-shape'
  | 'undo-receipt-shape'
  | 'undo-successor-mismatch'
  | StarAtlasStateProtectionReasonV1
  | 'successor-fixed-point';

/** Ephemeral one-level undo authority. It is emitted only after Remove is
 * durably committed. Main retains the live removed pair/route separately;
 * this immutable data receipt proves which exact current successor may be
 * reversed and contains no route object, timer, or optimistic state. */
export interface Arc9AtlasDeleteReceiptV1 {
  readonly schema: typeof ARC9_ATLAS_DELETE_RECEIPT_SCHEMA_V1;
  readonly removeOperation: string;
  readonly removeReceiptOrdinal: number;
  readonly removeWitness: string;
  readonly atlasId: string;
  readonly targetIndex: number;
  readonly removedPairJson: string;
  readonly removedRowSeal: string;
  readonly countAfterDelete: number;
  readonly homeIdBeforeDelete: string | null;
  readonly homeIdAfterDelete: string | null;
  readonly wasHome: boolean;
  readonly beforeDeleteRowsSeal: string;
  readonly afterDeleteRowsSeal: string;
  readonly beforeDeleteStateSeal: string;
  readonly afterDeleteStateSeal: string;
}

interface PlanBaseV1 {
  readonly kind: 'ready';
  readonly action: 'home' | 'remove' | 'undo';
  readonly operation: string;
  readonly receiptKind:
    | typeof ARC9_ATLAS_HOME_RECEIPT_KIND_V1
    | typeof ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1
    | typeof ARC9_ATLAS_UNDO_RECEIPT_KIND_V1;
  readonly atlasId: string;
  readonly targetIndex: number;
  readonly homeIdBefore: string | null;
  readonly homeIdAfter: string | null;
  readonly sourceRowsSeal: string;
  readonly successorRowsSeal: string;
  readonly sourceStateSeal: string;
  readonly successorStateSeal: string;
  readonly successorState: SaveStateV2;
}

export interface Arc9AtlasHomeReadyV1 extends PlanBaseV1 {
  readonly action: 'home';
  readonly receiptKind: typeof ARC9_ATLAS_HOME_RECEIPT_KIND_V1;
  readonly desired: boolean;
}

export interface Arc9AtlasRemoveReadyV1 extends PlanBaseV1 {
  readonly action: 'remove';
  readonly receiptKind: typeof ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1;
  readonly removedRowSeal: string;
  readonly removedPairJson: string;
  readonly countBefore: number;
  readonly countAfter: number;
}

export interface Arc9AtlasUndoReadyV1 extends PlanBaseV1 {
  readonly action: 'undo';
  readonly receiptKind: typeof ARC9_ATLAS_UNDO_RECEIPT_KIND_V1;
  readonly deleteReceipt: Arc9AtlasDeleteReceiptV1;
  readonly deleteReceiptSeal: string;
  readonly removedRowSeal: string;
  readonly removedPairJson: string;
  readonly countBefore: number;
  readonly countAfter: number;
}

type MutationPlanV1 = Arc9AtlasHomeReadyV1 | Arc9AtlasRemoveReadyV1 | Arc9AtlasUndoReadyV1;

export type Arc9AtlasHomePreparationV1 =
  | Arc9AtlasHomeReadyV1
  | Readonly<{
    kind: 'current';
    atlasId: string;
    targetIndex: number;
    desired: boolean;
    homeId: string | null;
    atlasStateSeal: string;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9AtlasRowActionProtectionReasonV1 }>;

export type Arc9AtlasRemovePreparationV1 =
  | Arc9AtlasRemoveReadyV1
  | Readonly<{ kind: 'protected'; reason: Arc9AtlasRowActionProtectionReasonV1 }>;

export type Arc9AtlasUndoPreparationV1 =
  | Arc9AtlasUndoReadyV1
  | Readonly<{ kind: 'protected'; reason: Arc9AtlasRowActionProtectionReasonV1 }>;

function protectedPreparation(
  reason: Arc9AtlasRowActionProtectionReasonV1,
): Readonly<{ kind: 'protected'; reason: Arc9AtlasRowActionProtectionReasonV1 }> {
  return Object.freeze({ kind: 'protected', reason });
}

function captureFields(
  input: unknown,
  names: readonly string[],
): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(input);
  const stringKeys = keys.filter((key): key is string => typeof key === 'string');
  const expected = [...names].sort();
  if (stringKeys.length !== keys.length || stringKeys.length !== expected.length
    || [...stringKeys].sort().some((name, index) => name !== expected[index])) return null;
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const name of names) {
    const descriptor = Object.getOwnPropertyDescriptor(input, name);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
    fields[name] = descriptor.value;
  }
  return fields;
}

function exactSeal(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function capturedDeleteReceipt(value: unknown): Arc9AtlasDeleteReceiptV1 | null {
  const fields = captureFields(value, [
    'schema', 'removeOperation', 'removeReceiptOrdinal', 'removeWitness',
    'atlasId', 'targetIndex', 'removedPairJson', 'removedRowSeal',
    'countAfterDelete', 'homeIdBeforeDelete', 'homeIdAfterDelete', 'wasHome',
    'beforeDeleteRowsSeal', 'afterDeleteRowsSeal',
    'beforeDeleteStateSeal', 'afterDeleteStateSeal',
  ]);
  if (fields === null
    || fields.schema !== ARC9_ATLAS_DELETE_RECEIPT_SCHEMA_V1
    || !exactStarAtlasIdV1(fields.atlasId)
    || fields.removeOperation !== operationForArc9AtlasRemoveV1(fields.atlasId)
    || !Number.isSafeInteger(fields.removeReceiptOrdinal)
    || (fields.removeReceiptOrdinal as number) < 0
    || typeof fields.removeWitness !== 'string'
    || !/^arc9arv1:[a-f0-9]{64}$/u.test(fields.removeWitness)
    || !Number.isSafeInteger(fields.targetIndex) || (fields.targetIndex as number) < 0
    || typeof fields.removedPairJson !== 'string'
    || fields.removedPairJson.length < 5 || fields.removedPairJson.length > 16 * 1024 * 1024
    || !exactSeal(fields.removedRowSeal)
    || !Number.isSafeInteger(fields.countAfterDelete)
    || (fields.countAfterDelete as number) < 0 || (fields.countAfterDelete as number) >= 120
    || (fields.targetIndex as number) > (fields.countAfterDelete as number)
    || typeof fields.wasHome !== 'boolean'
    || !exactSeal(fields.beforeDeleteRowsSeal) || !exactSeal(fields.afterDeleteRowsSeal)
    || !exactSeal(fields.beforeDeleteStateSeal) || !exactSeal(fields.afterDeleteStateSeal)) {
    return null;
  }
  const atlasId = fields.atlasId as string;
  const homeIdBeforeDelete = fields.homeIdBeforeDelete;
  const homeIdAfterDelete = fields.homeIdAfterDelete;
  if ((homeIdBeforeDelete !== null && !exactStarAtlasIdV1(homeIdBeforeDelete))
    || (homeIdAfterDelete !== null && !exactStarAtlasIdV1(homeIdAfterDelete))
    || (fields.wasHome === true
      ? homeIdBeforeDelete !== atlasId || homeIdAfterDelete !== null
      : homeIdBeforeDelete !== homeIdAfterDelete || homeIdBeforeDelete === atlasId)) return null;
  const receipt = Object.freeze({
    schema: ARC9_ATLAS_DELETE_RECEIPT_SCHEMA_V1,
    removeOperation: fields.removeOperation as string,
    removeReceiptOrdinal: fields.removeReceiptOrdinal as number,
    removeWitness: fields.removeWitness as string,
    atlasId,
    targetIndex: fields.targetIndex as number,
    removedPairJson: fields.removedPairJson as string,
    removedRowSeal: fields.removedRowSeal as string,
    countAfterDelete: fields.countAfterDelete as number,
    homeIdBeforeDelete: homeIdBeforeDelete as string | null,
    homeIdAfterDelete: homeIdAfterDelete as string | null,
    wasHome: fields.wasHome,
    beforeDeleteRowsSeal: fields.beforeDeleteRowsSeal as string,
    afterDeleteRowsSeal: fields.afterDeleteRowsSeal as string,
    beforeDeleteStateSeal: fields.beforeDeleteStateSeal as string,
    afterDeleteStateSeal: fields.afterDeleteStateSeal as string,
  });
  const expectedRemoveWitness = `arc9arv1:${sha256Hex(canonicalJson({
    schema: ARC9_ATLAS_REMOVE_WITNESS_SCHEMA_V1,
    action: 'remove',
    operation: receipt.removeOperation,
    receiptOrdinal: receipt.removeReceiptOrdinal,
    atlasId: receipt.atlasId,
    targetIndex: receipt.targetIndex,
    homeIdBefore: receipt.homeIdBeforeDelete,
    homeIdAfter: receipt.homeIdAfterDelete,
    sourceRowsSeal: receipt.beforeDeleteRowsSeal,
    successorRowsSeal: receipt.afterDeleteRowsSeal,
    sourceStateSeal: receipt.beforeDeleteStateSeal,
    successorStateSeal: receipt.afterDeleteStateSeal,
    removedRowSeal: receipt.removedRowSeal,
    removedPairJson: receipt.removedPairJson,
    countBefore: receipt.countAfterDelete + 1,
    countAfter: receipt.countAfterDelete,
  }))}`;
  return receipt.removeWitness === expectedRemoveWitness ? receipt : null;
}

export function operationForArc9AtlasHomeV1(atlasId: string): string {
  if (!exactStarAtlasIdV1(atlasId)) {
    throw new TypeError('Arc 9 Atlas Home operation requires one exact Atlas id');
  }
  return `${HOME_OPERATION_PREFIX}${sha256Hex(atlasId)}`;
}

export function operationForArc9AtlasRemoveV1(atlasId: string): string {
  if (!exactStarAtlasIdV1(atlasId)) {
    throw new TypeError('Arc 9 Atlas Remove operation requires one exact Atlas id');
  }
  return `${REMOVE_OPERATION_PREFIX}${sha256Hex(atlasId)}`;
}

export function operationForArc9AtlasUndoV1(receiptValue: Arc9AtlasDeleteReceiptV1): string {
  const receipt = capturedDeleteReceipt(receiptValue);
  if (receipt === null) {
    throw new TypeError('Arc 9 Atlas Undo operation requires one exact delete receipt');
  }
  return `${UNDO_OPERATION_PREFIX}${sha256Hex(canonicalJson(receipt))}`;
}

function checkedDetached(stateValue: SaveStateV2, atlasId: string): Readonly<{
  state: SaveStateV2;
  atlas: CheckedStarAtlasStateV1;
}> {
  const state = detachStarAtlasDataV1(stateValue);
  return Object.freeze({ state, atlas: inspectStarAtlasStateV1(state, atlasId, true) });
}

export function prepareArc9AtlasHomeV1(
  stateValue: SaveStateV2,
  atlasIdValue: string,
  desiredValue: boolean,
): Arc9AtlasHomePreparationV1 {
  try {
    if (!exactStarAtlasIdV1(atlasIdValue)) return protectedPreparation('atlas-id-shape');
    if (typeof desiredValue !== 'boolean') return protectedPreparation('desired-shape');
    const { state, atlas } = checkedDetached(stateValue, atlasIdValue);
    const homeIdAfter = desiredValue
      ? atlasIdValue
      : atlas.homeId === atlasIdValue ? null : atlas.homeId;
    if (atlas.homeId === homeIdAfter) {
      return Object.freeze({
        kind: 'current',
        atlasId: atlasIdValue,
        targetIndex: atlas.targetIndex,
        desired: desiredValue,
        homeId: atlas.homeId,
        atlasStateSeal: atlas.stateSeal,
      });
    }
    state.homeId = homeIdAfter;
    const successor = inspectStarAtlasStateV1(state, atlasIdValue, true);
    if (successor.targetIndex !== atlas.targetIndex
      || successor.rowsSeal !== atlas.rowsSeal
      || successor.homeId !== homeIdAfter) return protectedPreparation('successor-fixed-point');
    return Object.freeze({
      kind: 'ready',
      action: 'home',
      operation: operationForArc9AtlasHomeV1(atlasIdValue),
      receiptKind: ARC9_ATLAS_HOME_RECEIPT_KIND_V1,
      atlasId: atlasIdValue,
      targetIndex: atlas.targetIndex,
      desired: desiredValue,
      homeIdBefore: atlas.homeId,
      homeIdAfter,
      sourceRowsSeal: atlas.rowsSeal,
      successorRowsSeal: successor.rowsSeal,
      sourceStateSeal: atlas.stateSeal,
      successorStateSeal: successor.stateSeal,
      successorState: state,
    });
  } catch (error) {
    return protectedPreparation(
      error instanceof StarAtlasStateProtectionV1 ? error.reason : 'state-shape',
    );
  }
}

export function prepareArc9AtlasRemoveV1(
  stateValue: SaveStateV2,
  atlasIdValue: string,
): Arc9AtlasRemovePreparationV1 {
  try {
    if (!exactStarAtlasIdV1(atlasIdValue)) return protectedPreparation('atlas-id-shape');
    const { state, atlas } = checkedDetached(stateValue, atlasIdValue);
    const removedPair = atlas.rows[atlas.targetIndex]!;
    const removedPairJson = JSON.stringify(removedPair);
    if (typeof removedPairJson !== 'string') return protectedPreparation('successor-fixed-point');
    const removedRowSeal = sha256Hex(canonicalJson(removedPair));
    const sourceIds = atlas.rows.map(([id]) => id);
    state.logMap.splice(atlas.targetIndex, 1);
    if (state.homeId === atlasIdValue) state.homeId = null;
    const successor = inspectStarAtlasStateV1(state);
    const expectedIds = sourceIds.filter((_, index) => index !== atlas.targetIndex);
    if (successor.byId.has(atlasIdValue)
      || successor.rows.length !== atlas.rows.length - 1
      || !sameStarAtlasJsonV1(successor.rows.map(([id]) => id), expectedIds)
      || successor.homeId !== (atlas.homeId === atlasIdValue ? null : atlas.homeId)) {
      return protectedPreparation('successor-fixed-point');
    }
    return Object.freeze({
      kind: 'ready',
      action: 'remove',
      operation: operationForArc9AtlasRemoveV1(atlasIdValue),
      receiptKind: ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1,
      atlasId: atlasIdValue,
      targetIndex: atlas.targetIndex,
      homeIdBefore: atlas.homeId,
      homeIdAfter: successor.homeId,
      sourceRowsSeal: atlas.rowsSeal,
      successorRowsSeal: successor.rowsSeal,
      sourceStateSeal: atlas.stateSeal,
      successorStateSeal: successor.stateSeal,
      removedRowSeal,
      removedPairJson,
      countBefore: atlas.rows.length,
      countAfter: successor.rows.length,
      successorState: state,
    });
  } catch (error) {
    return protectedPreparation(
      error instanceof StarAtlasStateProtectionV1 ? error.reason : 'state-shape',
    );
  }
}

function removedPairFromReceipt(
  receipt: Arc9AtlasDeleteReceiptV1,
): [string, Record<string, unknown>] | null {
  try {
    const parsed = JSON.parse(receipt.removedPairJson) as unknown;
    const detached = detachStarAtlasDataV1(parsed);
    if (JSON.stringify(detached) !== receipt.removedPairJson
      || sha256Hex(canonicalJson(detached)) !== receipt.removedRowSeal
      || !Array.isArray(detached) || detached.length !== 2
      || detached[0] !== receipt.atlasId) return null;
    return detached as [string, Record<string, unknown>];
  } catch {
    return null;
  }
}

/** Restore only the exact durable successor named by a one-level delete
 * receipt. Any intervening Atlas mutation changes its state seal and expires
 * the receipt. Route availability remains a Main-owned precondition because
 * routes never enter persistence or this pure owner. */
export function prepareArc9AtlasUndoV1(
  stateValue: SaveStateV2,
  receiptValue: Arc9AtlasDeleteReceiptV1,
): Arc9AtlasUndoPreparationV1 {
  try {
    const receipt = capturedDeleteReceipt(receiptValue);
    if (receipt === null) return protectedPreparation('undo-receipt-shape');
    const state = detachStarAtlasDataV1(stateValue);
    const source = inspectStarAtlasStateV1(state);
    if (source.rows.length !== receipt.countAfterDelete
      || source.byId.has(receipt.atlasId)
      || source.rowsSeal !== receipt.afterDeleteRowsSeal
      || source.stateSeal !== receipt.afterDeleteStateSeal
      || source.homeId !== receipt.homeIdAfterDelete) {
      return protectedPreparation('undo-successor-mismatch');
    }
    const removedPair = removedPairFromReceipt(receipt);
    if (removedPair === null || receipt.targetIndex > state.logMap.length) {
      return protectedPreparation('undo-receipt-shape');
    }
    state.logMap.splice(receipt.targetIndex, 0, removedPair);
    state.homeId = receipt.wasHome ? receipt.atlasId : receipt.homeIdBeforeDelete;
    const successor = inspectStarAtlasStateV1(state, receipt.atlasId, true);
    if (successor.targetIndex !== receipt.targetIndex
      || successor.rows.length !== receipt.countAfterDelete + 1
      || successor.rowsSeal !== receipt.beforeDeleteRowsSeal
      || successor.stateSeal !== receipt.beforeDeleteStateSeal
      || successor.homeId !== receipt.homeIdBeforeDelete
      || sha256Hex(canonicalJson(successor.rows[receipt.targetIndex]))
        !== receipt.removedRowSeal) {
      return protectedPreparation('successor-fixed-point');
    }
    return Object.freeze({
      kind: 'ready',
      action: 'undo',
      operation: operationForArc9AtlasUndoV1(receipt),
      receiptKind: ARC9_ATLAS_UNDO_RECEIPT_KIND_V1,
      atlasId: receipt.atlasId,
      targetIndex: receipt.targetIndex,
      homeIdBefore: receipt.homeIdAfterDelete,
      homeIdAfter: receipt.homeIdBeforeDelete,
      sourceRowsSeal: receipt.afterDeleteRowsSeal,
      successorRowsSeal: receipt.beforeDeleteRowsSeal,
      sourceStateSeal: receipt.afterDeleteStateSeal,
      successorStateSeal: receipt.beforeDeleteStateSeal,
      deleteReceipt: receipt,
      deleteReceiptSeal: sha256Hex(canonicalJson(receipt)),
      removedRowSeal: receipt.removedRowSeal,
      removedPairJson: receipt.removedPairJson,
      countBefore: receipt.countAfterDelete,
      countAfter: receipt.countAfterDelete + 1,
      successorState: state,
    });
  } catch (error) {
    return protectedPreparation(
      error instanceof StarAtlasStateProtectionV1 ? error.reason : 'state-shape',
    );
  }
}

interface CapturedBaseV1 {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly atlasId: string;
  readonly codecNow: number;
}

interface CapturedHomeV1 extends CapturedBaseV1 { readonly desired: boolean; }
interface CapturedUndoV1 extends CapturedBaseV1 {
  readonly deleteReceipt: Arc9AtlasDeleteReceiptV1;
}

function capturedBase(fields: Record<string, unknown>): CapturedBaseV1 | null {
  try {
    const runtime = fields.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)
      || !exactStarAtlasIdV1(fields.atlasId)
      || !Number.isSafeInteger(fields.codecNow) || (fields.codecNow as number) < 0) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: detachStarAtlasDataV1(fields.state) as SaveStateV2,
      atlasId: fields.atlasId,
      codecNow: fields.codecNow as number,
    });
  } catch {
    return null;
  }
}

function captureHome(input: Arc9AtlasHomeActionInputV1): CapturedHomeV1 | null {
  const fields = captureFields(input, ['runtime', 'state', 'atlasId', 'desired', 'codecNow']);
  if (fields === null || typeof fields.desired !== 'boolean') return null;
  const base = capturedBase(fields);
  return base === null ? null : Object.freeze({ ...base, desired: fields.desired });
}

function captureRemove(input: Arc9AtlasRemoveActionInputV1): CapturedBaseV1 | null {
  const fields = captureFields(input, ['runtime', 'state', 'atlasId', 'codecNow']);
  return fields === null ? null : capturedBase(fields);
}

function captureUndo(input: Arc9AtlasUndoActionInputV1): CapturedUndoV1 | null {
  const fields = captureFields(input, ['runtime', 'state', 'deleteReceipt', 'codecNow']);
  if (fields === null) return null;
  const deleteReceipt = capturedDeleteReceipt(fields.deleteReceipt);
  if (deleteReceipt === null) return null;
  const base = capturedBase({ ...fields, atlasId: deleteReceipt.atlasId });
  return base === null ? null : Object.freeze({ ...base, deleteReceipt });
}

function planFacts(plan: MutationPlanV1, receiptOrdinal: number): Readonly<Record<string, unknown>> {
  const common = {
    schema: plan.action === 'home'
      ? ARC9_ATLAS_HOME_WITNESS_SCHEMA_V1
      : plan.action === 'remove'
        ? ARC9_ATLAS_REMOVE_WITNESS_SCHEMA_V1 : ARC9_ATLAS_UNDO_WITNESS_SCHEMA_V1,
    action: plan.action,
    operation: plan.operation,
    receiptOrdinal,
    atlasId: plan.atlasId,
    targetIndex: plan.targetIndex,
    homeIdBefore: plan.homeIdBefore,
    homeIdAfter: plan.homeIdAfter,
    sourceRowsSeal: plan.sourceRowsSeal,
    successorRowsSeal: plan.successorRowsSeal,
    sourceStateSeal: plan.sourceStateSeal,
    successorStateSeal: plan.successorStateSeal,
  };
  if (plan.action === 'home') return Object.freeze({ ...common, desired: plan.desired });
  if (plan.action === 'remove') {
    return Object.freeze({
      ...common,
      removedRowSeal: plan.removedRowSeal,
      removedPairJson: plan.removedPairJson,
      countBefore: plan.countBefore,
      countAfter: plan.countAfter,
    });
  }
  return Object.freeze({
    ...common,
    deleteReceiptSeal: plan.deleteReceiptSeal,
    removedRowSeal: plan.removedRowSeal,
    removedPairJson: plan.removedPairJson,
    countBefore: plan.countBefore,
    countAfter: plan.countAfter,
  });
}

function witnessFor(plan: MutationPlanV1, receiptOrdinal: number): string {
  const prefix = plan.action === 'home' ? 'arc9ahv1:'
    : plan.action === 'remove' ? 'arc9arv1:' : 'arc9auv1:';
  return `${prefix}${sha256Hex(canonicalJson(planFacts(plan, receiptOrdinal)))}`;
}

function samePlan(left: MutationPlanV1, right: MutationPlanV1): boolean {
  return left.action === right.action
    && left.operation === right.operation
    && left.receiptKind === right.receiptKind
    && left.atlasId === right.atlasId
    && left.targetIndex === right.targetIndex
    && left.homeIdBefore === right.homeIdBefore
    && left.homeIdAfter === right.homeIdAfter
    && left.sourceRowsSeal === right.sourceRowsSeal
    && left.successorRowsSeal === right.successorRowsSeal
    && left.sourceStateSeal === right.sourceStateSeal
    && left.successorStateSeal === right.successorStateSeal
    && (left.action === 'home' && right.action === 'home'
      ? left.desired === right.desired
      : left.action === 'remove' && right.action === 'remove'
        ? left.removedRowSeal === right.removedRowSeal
          && left.removedPairJson === right.removedPairJson
          && left.countBefore === right.countBefore
          && left.countAfter === right.countAfter
        : left.action === 'undo' && right.action === 'undo'
          && left.deleteReceiptSeal === right.deleteReceiptSeal
          && left.removedRowSeal === right.removedRowSeal
          && left.removedPairJson === right.removedPairJson
          && left.countBefore === right.countBefore
          && left.countAfter === right.countAfter)
    && sameStarAtlasJsonV1(left.successorState, right.successorState);
}

function fixedPoint(state: SaveStateV2, plan: MutationPlanV1): boolean {
  try {
    const atlas = inspectStarAtlasStateV1(
      detachStarAtlasDataV1(state),
      plan.atlasId,
      plan.action !== 'remove',
    );
    if (atlas.stateSeal !== plan.successorStateSeal
      || atlas.rowsSeal !== plan.successorRowsSeal
      || atlas.homeId !== plan.homeIdAfter) return false;
    return plan.action === 'home'
      ? atlas.targetIndex === plan.targetIndex && atlas.targetEntry !== null
      : plan.action === 'remove'
        ? atlas.targetEntry === null && atlas.rows.length === plan.countAfter
        : atlas.targetIndex === plan.targetIndex && atlas.targetEntry !== null
          && atlas.rows.length === plan.countAfter;
  } catch {
    return false;
  }
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): string {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') return outcome.message;
  if (outcome.kind === 'protected') return `protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `lost:${outcome.reason}`;
  return outcome.kind;
}

function needsReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

interface CommitPreparedSuccessV1 {
  readonly kind: 'committed';
  readonly transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  readonly plan: MutationPlanV1;
  readonly witness: string;
}

type CommitPreparedV1 =
  | CommitPreparedSuccessV1
  | Readonly<{
    kind: 'committed-convergence';
    detail: 'committed-atlas-row-evidence-missing' | 'committed-atlas-row-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    convergence: 'none' | 'read-only-reload';
    detail: `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

async function commitPrepared(
  captured: CapturedBaseV1,
  preflight: MutationPlanV1,
  reprepare: (state: SaveStateV2) =>
    Arc9AtlasHomePreparationV1 | Arc9AtlasRemovePreparationV1 | Arc9AtlasUndoPreparationV1,
): Promise<CommitPreparedV1> {
  let selected: Readonly<{
    plan: MutationPlanV1;
    witness: string;
    expectedState: SaveStateV2;
  }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: preflight.operation,
      receiptKind: preflight.receiptKind,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft, canonicalizeState }) => {
        const plan = reprepare(draft);
        if (plan.kind !== 'ready' || !samePlan(plan, preflight)) {
          throw new Error('Arc 9 Atlas row parent changed before derivation');
        }
        const witness = witnessFor(plan, receiptOrdinal);
        selected = Object.freeze({
          plan,
          witness,
          expectedState: canonicalizeState(plan.successorState),
        });
        return Object.freeze({
          state: plan.successorState,
          extensionWrites: Object.freeze([]),
          witness,
        });
      },
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused',
      convergence: 'read-only-reload',
      detail: `transaction:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused',
      convergence: needsReload(transaction) ? 'read-only-reload' : 'none',
      detail: `transaction:${transactionDetail(transaction)}`,
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    plan: MutationPlanV1;
    witness: string;
    expectedState: SaveStateV2;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence',
      detail: 'committed-atlas-row-evidence-missing',
      transaction,
    });
  }
  const plan = committedSelection.plan;
  const noRng = transaction.plan.currentAuthority.sessionRng.seed
      === transaction.plan.nextSessionRng.seed
    && transaction.plan.nextSessionRng.ordinal
      === transaction.plan.currentAuthority.sessionRng.ordinal + 1
    && sameStarAtlasJsonV1(
      transaction.plan.currentAuthority.sessionRng.draws,
      transaction.plan.nextSessionRng.draws,
    );
  if (!fixedPoint(transaction.state, plan)
    || transaction.plan.operation !== plan.operation
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== plan.receiptKind
    || transaction.receipt.witness !== committedSelection.witness
    || !sameStarAtlasJsonV1(transaction.state, transaction.saved.canonicalState)
    || !sameStarAtlasJsonV1(transaction.state, committedSelection.expectedState)
    || !noRng) {
    return Object.freeze({
      kind: 'committed-convergence',
      detail: 'committed-atlas-row-fixed-point-mismatch',
      transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', transaction, plan, witness: committedSelection.witness,
  });
}

export interface Arc9AtlasHomeActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly atlasId: string;
  readonly desired: boolean;
  readonly codecNow: number;
}

export interface Arc9AtlasRemoveActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly atlasId: string;
  readonly codecNow: number;
}

export interface Arc9AtlasUndoActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly deleteReceipt: Arc9AtlasDeleteReceiptV1;
  readonly codecNow: number;
}

type RefusedOutcomeV1 = Readonly<{
  kind: 'refused';
  durability: 'none';
  convergence: 'none' | 'read-only-reload';
  detail: 'input:invalid-or-unregistered'
    | `preflight:${Arc9AtlasRowActionProtectionReasonV1}`
    | `transaction:${string}`;
  transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
}>;

type ConvergenceOutcomeV1 = Readonly<{
  kind: 'committed-convergence';
  durability: 'committed';
  convergence: 'read-only-reload';
  detail: 'committed-atlas-row-evidence-missing' | 'committed-atlas-row-fixed-point-mismatch';
  transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
}>;

export type Arc9AtlasHomeActionOutcomeV1 =
  | Readonly<{
    kind: 'current';
    durability: 'none';
    convergence: 'none';
    transaction: null;
    atlasId: string;
    targetIndex: number;
    desired: boolean;
    homeId: string | null;
    atlasStateSeal: string;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    witness: string;
    plan: Arc9AtlasHomeReadyV1;
  }>
  | ConvergenceOutcomeV1
  | RefusedOutcomeV1;

export type Arc9AtlasRemoveActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    witness: string;
    plan: Arc9AtlasRemoveReadyV1;
    undoReceipt: Arc9AtlasDeleteReceiptV1;
  }>
  | ConvergenceOutcomeV1
  | RefusedOutcomeV1;

export type Arc9AtlasUndoActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    witness: string;
    plan: Arc9AtlasUndoReadyV1;
  }>
  | ConvergenceOutcomeV1
  | RefusedOutcomeV1;

function refusedInput(): RefusedOutcomeV1 {
  return Object.freeze({
    kind: 'refused', durability: 'none', convergence: 'none',
    detail: 'input:invalid-or-unregistered', transaction: null,
  });
}

function refusedPreflight(reason: Arc9AtlasRowActionProtectionReasonV1): RefusedOutcomeV1 {
  return Object.freeze({
    kind: 'refused', durability: 'none', convergence: 'none',
    detail: `preflight:${reason}`, transaction: null,
  });
}

export async function commitArc9AtlasHomeV1(
  input: Arc9AtlasHomeActionInputV1,
): Promise<Arc9AtlasHomeActionOutcomeV1> {
  const captured = captureHome(input);
  if (captured === null) return refusedInput();
  const preflight = prepareArc9AtlasHomeV1(
    captured.state, captured.atlasId, captured.desired,
  );
  if (preflight.kind === 'protected') return refusedPreflight(preflight.reason);
  if (preflight.kind === 'current') {
    return Object.freeze({
      ...preflight, durability: 'none', convergence: 'none', transaction: null,
    });
  }
  const committed = await commitPrepared(
    captured,
    preflight,
    (state) => prepareArc9AtlasHomeV1(state, captured.atlasId, captured.desired),
  );
  if (committed.kind === 'refused') {
    return Object.freeze({ ...committed, durability: 'none' });
  }
  if (committed.kind === 'committed-convergence') {
    return Object.freeze({
      ...committed, durability: 'committed', convergence: 'read-only-reload',
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none',
    transaction: committed.transaction,
    witness: committed.witness,
    plan: committed.plan as Arc9AtlasHomeReadyV1,
  });
}

function deleteReceiptFor(
  plan: Arc9AtlasRemoveReadyV1,
  transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
  witness: string,
): Arc9AtlasDeleteReceiptV1 {
  return Object.freeze({
    schema: ARC9_ATLAS_DELETE_RECEIPT_SCHEMA_V1,
    removeOperation: plan.operation,
    removeReceiptOrdinal: transaction.receipt.ordinal,
    removeWitness: witness,
    atlasId: plan.atlasId,
    targetIndex: plan.targetIndex,
    removedPairJson: plan.removedPairJson,
    removedRowSeal: plan.removedRowSeal,
    countAfterDelete: plan.countAfter,
    homeIdBeforeDelete: plan.homeIdBefore,
    homeIdAfterDelete: plan.homeIdAfter,
    wasHome: plan.homeIdBefore === plan.atlasId,
    beforeDeleteRowsSeal: plan.sourceRowsSeal,
    afterDeleteRowsSeal: plan.successorRowsSeal,
    beforeDeleteStateSeal: plan.sourceStateSeal,
    afterDeleteStateSeal: plan.successorStateSeal,
  });
}

export async function commitArc9AtlasRemoveV1(
  input: Arc9AtlasRemoveActionInputV1,
): Promise<Arc9AtlasRemoveActionOutcomeV1> {
  const captured = captureRemove(input);
  if (captured === null) return refusedInput();
  const preflight = prepareArc9AtlasRemoveV1(captured.state, captured.atlasId);
  if (preflight.kind === 'protected') return refusedPreflight(preflight.reason);
  const committed = await commitPrepared(
    captured,
    preflight,
    (state) => prepareArc9AtlasRemoveV1(state, captured.atlasId),
  );
  if (committed.kind === 'refused') {
    return Object.freeze({ ...committed, durability: 'none' });
  }
  if (committed.kind === 'committed-convergence') {
    return Object.freeze({
      ...committed, durability: 'committed', convergence: 'read-only-reload',
    });
  }
  const plan = committed.plan as Arc9AtlasRemoveReadyV1;
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none',
    transaction: committed.transaction,
    witness: committed.witness,
    plan,
    undoReceipt: deleteReceiptFor(plan, committed.transaction, committed.witness),
  });
}

export async function commitArc9AtlasUndoV1(
  input: Arc9AtlasUndoActionInputV1,
): Promise<Arc9AtlasUndoActionOutcomeV1> {
  const captured = captureUndo(input);
  if (captured === null) return refusedInput();
  const preflight = prepareArc9AtlasUndoV1(captured.state, captured.deleteReceipt);
  if (preflight.kind === 'protected') return refusedPreflight(preflight.reason);
  const committed = await commitPrepared(
    captured,
    preflight,
    (state) => prepareArc9AtlasUndoV1(state, captured.deleteReceipt),
  );
  if (committed.kind === 'refused') {
    return Object.freeze({ ...committed, durability: 'none' });
  }
  if (committed.kind === 'committed-convergence') {
    return Object.freeze({
      ...committed, durability: 'committed', convergence: 'read-only-reload',
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none',
    transaction: committed.transaction,
    witness: committed.witness,
    plan: committed.plan as Arc9AtlasUndoReadyV1,
  });
}

function exactPublicationParent(
  target: SaveStateV2,
  plan: MutationPlanV1,
): Readonly<{
  atlas: CheckedStarAtlasStateV1;
  liveRows: SaveStateV2['logMap'];
}> {
  const detached = detachStarAtlasDataV1(target);
  const atlas = inspectStarAtlasStateV1(detached, plan.atlasId, true);
  const liveRoot = starAtlasPlainRecordV1(target, 'state-shape');
  const logDescriptor = writableStarAtlasDataV1(liveRoot, 'logMap');
  const homeDescriptor = writableStarAtlasDataV1(liveRoot, 'homeId');
  if (atlas.targetIndex !== plan.targetIndex
    || atlas.rowsSeal !== plan.sourceRowsSeal
    || atlas.stateSeal !== plan.sourceStateSeal
    || atlas.homeId !== plan.homeIdBefore
    || !logDescriptor || !homeDescriptor || !Array.isArray(logDescriptor.value)) {
    throw new TypeError('Arc 9 Atlas row publication requires its exact live parent');
  }
  return Object.freeze({ atlas, liveRows: logDescriptor.value as SaveStateV2['logMap'] });
}

function exactDurableFixedPoint(
  outcome: Readonly<{
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    plan: MutationPlanV1;
  }>,
): void {
  if (!fixedPoint(outcome.transaction.state, outcome.plan)
    || !sameStarAtlasJsonV1(
      outcome.transaction.state,
      outcome.transaction.saved.canonicalState,
    )) {
    throw new TypeError('Arc 9 Atlas row publication requires its committed fixed point');
  }
}

export function publishArc9AtlasHomeFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9AtlasHomeActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  exactPublicationParent(target, outcome.plan);
  exactDurableFixedPoint(outcome);
  target.homeId = outcome.plan.homeIdAfter;
}

export function publishArc9AtlasRemoveFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9AtlasRemoveActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  const parent = exactPublicationParent(target, outcome.plan);
  exactDurableFixedPoint(outcome);
  const rows = parent.liveRows;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(rows, 'length');
  if (!lengthDescriptor || lengthDescriptor.writable !== true) {
    throw new TypeError('Arc 9 Atlas Remove publication requires a writable exact row list');
  }
  for (let index = outcome.plan.targetIndex; index < rows.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(rows, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
      || descriptor.writable !== true || descriptor.configurable !== true) {
      throw new TypeError('Arc 9 Atlas Remove publication requires a writable exact row list');
    }
  }
  rows.splice(outcome.plan.targetIndex, 1);
  target.homeId = outcome.plan.homeIdAfter;
}

export function publishArc9AtlasUndoFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9AtlasUndoActionOutcomeV1, { readonly kind: 'committed' }>,
  retainedPair: SaveStateV2['logMap'][number],
): void {
  exactDurableFixedPoint(outcome);
  const plan = outcome.plan;
  const liveRoot = starAtlasPlainRecordV1(target, 'state-shape');
  const logDescriptor = writableStarAtlasDataV1(liveRoot, 'logMap');
  const homeDescriptor = writableStarAtlasDataV1(liveRoot, 'homeId');
  const detached = detachStarAtlasDataV1(target);
  const source = inspectStarAtlasStateV1(detached);
  let detachedPair: SaveStateV2['logMap'][number];
  try { detachedPair = detachStarAtlasDataV1(retainedPair); }
  catch { throw new TypeError('Arc 9 Atlas Undo publication requires its exact retained pair'); }
  if (!logDescriptor || !homeDescriptor || !Array.isArray(logDescriptor.value)
    || source.byId.has(plan.atlasId)
    || source.rows.length !== plan.countBefore
    || source.rowsSeal !== plan.sourceRowsSeal
    || source.stateSeal !== plan.sourceStateSeal
    || source.homeId !== plan.homeIdBefore
    || JSON.stringify(detachedPair) !== plan.removedPairJson
    || sha256Hex(canonicalJson(detachedPair)) !== plan.removedRowSeal) {
    throw new TypeError('Arc 9 Atlas Undo publication requires its exact current successor and retained pair');
  }
  const proofState = detachStarAtlasDataV1(target);
  proofState.logMap.splice(plan.targetIndex, 0, detachedPair);
  proofState.homeId = plan.homeIdAfter;
  if (!fixedPoint(proofState, plan)) {
    throw new TypeError('Arc 9 Atlas Undo publication requires its exact restorable fixed point');
  }
  const rows = logDescriptor.value as SaveStateV2['logMap'];
  const lengthDescriptor = Object.getOwnPropertyDescriptor(rows, 'length');
  if (!lengthDescriptor || lengthDescriptor.writable !== true || !Object.isExtensible(rows)) {
    throw new TypeError('Arc 9 Atlas Undo publication requires a writable exact row list');
  }
  for (let index = plan.targetIndex; index < rows.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(rows, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
      || descriptor.writable !== true || descriptor.configurable !== true) {
      throw new TypeError('Arc 9 Atlas Undo publication requires a writable exact row list');
    }
  }
  rows.splice(plan.targetIndex, 0, retainedPair);
  target.homeId = plan.homeIdAfter;
}
