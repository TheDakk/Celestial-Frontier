/* Arc 5 companion assignment projection.

   Assignment bytes are durable facts, while Recovery readiness is a pure
   projection of the F4 active-play clock. A completed Recovery therefore
   becomes command-available without a wall-clock timer or receipt-free
   background writer. The next receipt-bearing companion action may replace
   the historical assignment as part of its ordinary successor. */
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import type {
  CreatureAssignmentV1,
  CreatureInstanceV1,
} from './model.js';

export const COMPANION_LOCKED_COMMANDS_V1 = Object.freeze([
  'breed',
  'combat',
  'dispatch',
] as const);

export type CompanionLockedCommandV1 = typeof COMPANION_LOCKED_COMMANDS_V1[number];

export interface CompanionAvailabilityV1 {
  readonly schema: 'cf-v2-companion-availability/v1';
  readonly activePlayMs: number;
  /** Null means available now, including a Recovery whose exact boundary has
      been reached. Mission assignments never expire through this projector. */
  readonly assignment: CreatureAssignmentV1 | null;
  readonly recovered: boolean;
  readonly recoveryReadyAtActivePlayMs: number | null;
  readonly recoveryRemainingActivePlayMs: number;
  readonly blocks: Readonly<Record<CompanionLockedCommandV1, boolean>>;
}

function checkedActivePlayMs(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0
    || (value as number) > MAX_ACTIVE_PLAY_MS) {
    throw new RangeError(
      `companion activePlayMs must be an integer from 0 through ${MAX_ACTIVE_PLAY_MS}`,
    );
  }
  return value as number;
}

function checkedAssignment(value: CreatureAssignmentV1 | null): CreatureAssignmentV1 | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('companion assignment must be an object or null');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('companion assignment must use a plain prototype');
  }
  const keys = Reflect.ownKeys(value);
  const kind = Object.getOwnPropertyDescriptor(value, 'kind');
  if (!kind || !('value' in kind) || kind.enumerable !== true
    || typeof kind.value !== 'string') {
    throw new TypeError('companion assignment kind must be an enumerable own data field');
  }
  if (kind.value === 'mission') {
    if (keys.length !== 2 || !keys.includes('kind') || !keys.includes('missionId')) {
      throw new TypeError('mission assignment shape changed');
    }
    const missionId = Object.getOwnPropertyDescriptor(value, 'missionId');
    if (!missionId || !('value' in missionId) || missionId.enumerable !== true
      || typeof missionId.value !== 'string' || missionId.value.length < 1
      || missionId.value.length > 128 || /[\u0000-\u001f\u007f]/u.test(missionId.value)) {
      throw new TypeError('mission assignment ID is invalid');
    }
    return Object.freeze({ kind: 'mission', missionId: missionId.value });
  }
  if (kind.value === 'recovery') {
    if (keys.length !== 2 || !keys.includes('kind') || !keys.includes('readyAtActivePlayMs')) {
      throw new TypeError('Recovery assignment shape changed');
    }
    const readyAt = Object.getOwnPropertyDescriptor(value, 'readyAtActivePlayMs');
    if (!readyAt || !('value' in readyAt) || readyAt.enumerable !== true) {
      throw new TypeError('Recovery assignment contains an accessor');
    }
    return Object.freeze({
      kind: 'recovery',
      readyAtActivePlayMs: checkedActivePlayMs(readyAt.value),
    });
  }
  throw new TypeError('companion assignment kind is invalid');
}

/** Project the exact command lock at one persisted F4 active-play snapshot.
 * Equality completes Recovery: `activePlayMs >= readyAtActivePlayMs` is
 * available, never one tick later and never from wall time. */
export function projectCompanionAvailabilityV1(
  creature: Pick<CreatureInstanceV1, 'assignment'>,
  activePlayMs: number,
): CompanionAvailabilityV1 {
  if (!creature || typeof creature !== 'object' || Array.isArray(creature)) {
    throw new TypeError('companion availability requires a creature');
  }
  const assignmentDescriptor = Object.getOwnPropertyDescriptor(creature, 'assignment');
  if (!assignmentDescriptor || !('value' in assignmentDescriptor)
    || assignmentDescriptor.enumerable !== true) {
    throw new TypeError('companion assignment must be an enumerable own data field');
  }
  const now = checkedActivePlayMs(activePlayMs);
  const stored = checkedAssignment(
    assignmentDescriptor.value as CreatureAssignmentV1 | null,
  );
  const recovered = stored?.kind === 'recovery'
    && now >= stored.readyAtActivePlayMs;
  const assignment = recovered ? null : stored;
  const blocked = assignment !== null;
  const blocks = Object.freeze({
    breed: blocked,
    combat: blocked,
    dispatch: blocked,
  });
  return Object.freeze({
    schema: 'cf-v2-companion-availability/v1',
    activePlayMs: now,
    assignment,
    recovered,
    recoveryReadyAtActivePlayMs: stored?.kind === 'recovery'
      ? stored.readyAtActivePlayMs : null,
    recoveryRemainingActivePlayMs: stored?.kind === 'recovery'
      ? Math.max(0, stored.readyAtActivePlayMs - now) : 0,
    blocks,
  });
}

export function companionCommandAvailableV1(
  creature: Pick<CreatureInstanceV1, 'assignment'>,
  activePlayMs: number,
  command: CompanionLockedCommandV1,
): boolean {
  if (!(COMPANION_LOCKED_COMMANDS_V1 as readonly string[]).includes(command)) {
    throw new TypeError('companion command is invalid');
  }
  return projectCompanionAvailabilityV1(creature, activePlayMs).blocks[command] === false;
}
