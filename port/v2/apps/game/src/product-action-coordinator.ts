/* Main-owned synchronous single-flight latch for receipt-bearing product
   actions. Ordinary persistence may queue behind the active claim's exact
   barrier, but no second Arc owner can cross the first await concurrently. */

export const PRODUCT_ACTION_COORDINATOR_DIAGNOSTICS_SCHEMA =
  'cf-v2-product-action-coordinator-diagnostics/v1' as const;
export const PRODUCT_ACTION_HOLD_DIAGNOSTICS_SCHEMA =
  'cf-v2-product-action-hold-diagnostics/v1' as const;

export interface ProductActionClaim {
  readonly operation: string;
  readonly barrier: Promise<boolean>;
  /** Resolve the persistence barrier exactly once with the durable outcome. */
  settle(durable: boolean): void;
}

export interface ProductActionCoordinatorDiagnostics {
  readonly schema: typeof PRODUCT_ACTION_COORDINATOR_DIAGNOSTICS_SCHEMA;
  readonly busy: boolean;
  readonly operation: string | null;
}

export interface ProductActionCoordinator {
  /** Synchronous. Null means another receipt-bearing action already owns work. */
  tryClaim(operation: string): ProductActionClaim | null;
  diagnostics(): ProductActionCoordinatorDiagnostics;
  readonly busy: boolean;
}

function checkedOperation(operation: unknown): string {
  if (typeof operation !== 'string' || operation.length < 1 || operation.length > 128) {
    throw new RangeError('Product action operation must contain 1 through 128 characters');
  }
  return operation;
}

export function createProductActionCoordinator(): ProductActionCoordinator {
  let activeToken: object | null = null;
  let activeOperation: string | null = null;

  return Object.freeze({
    tryClaim(operation: string): ProductActionClaim | null {
      const canonicalOperation = checkedOperation(operation);
      if (activeToken !== null) return null;
      const token = Object.freeze({});
      let resolveBarrier: (durable: boolean) => void = () => undefined;
      const barrier = new Promise<boolean>((resolve) => { resolveBarrier = resolve; });
      let settled = false;
      activeToken = token;
      activeOperation = canonicalOperation;
      return Object.freeze({
        operation: canonicalOperation,
        barrier,
        settle(durable: boolean): void {
          if (typeof durable !== 'boolean') {
            throw new TypeError('Product action durability must be boolean');
          }
          if (settled || activeToken !== token) {
            throw new Error('Product action claim is no longer active');
          }
          settled = true;
          activeToken = null;
          activeOperation = null;
          resolveBarrier(durable);
        },
      });
    },
    diagnostics(): ProductActionCoordinatorDiagnostics {
      return Object.freeze({
        schema: PRODUCT_ACTION_COORDINATOR_DIAGNOSTICS_SCHEMA,
        busy: activeToken !== null,
        operation: activeOperation,
      });
    },
    get busy(): boolean { return activeToken !== null; },
  });
}

export type ProductActionHoldPhase =
  | 'idle'
  | 'armed'
  | 'holding'
  | 'release-requested'
  | 'released';

export interface ProductActionHoldDiagnostics {
  readonly schema: typeof PRODUCT_ACTION_HOLD_DIAGNOSTICS_SCHEMA;
  readonly phase: ProductActionHoldPhase;
  readonly operation: string | null;
  /** Monotonic but bounded arm identity; no unbounded event history is kept. */
  readonly sequence: number;
}

export interface ProductActionDiagnosticHold {
  arm(): boolean;
  holdIfArmed(operation: string): Promise<void>;
  release(): boolean;
  diagnostics(): ProductActionHoldDiagnostics;
}

/** Diagnostics-only gate used by browser evidence. It owns no product state
 * and is entered only after the production coordinator has claimed work. */
export function createProductActionDiagnosticHold(): ProductActionDiagnosticHold {
  let phase: ProductActionHoldPhase = 'idle';
  let operation: string | null = null;
  let sequence = 0;
  let releaseGate: (() => void) | null = null;

  const diagnostics = (): ProductActionHoldDiagnostics => Object.freeze({
    schema: PRODUCT_ACTION_HOLD_DIAGNOSTICS_SCHEMA,
    phase,
    operation,
    sequence,
  });

  return Object.freeze({
    arm(): boolean {
      if (phase === 'armed' || phase === 'holding' || phase === 'release-requested'
        || sequence >= Number.MAX_SAFE_INTEGER) return false;
      sequence += 1;
      phase = 'armed';
      operation = null;
      return true;
    },
    async holdIfArmed(candidate: string): Promise<void> {
      const canonicalOperation = checkedOperation(candidate);
      if (phase !== 'armed') return;
      operation = canonicalOperation;
      phase = 'holding';
      const gate = new Promise<void>((resolve) => { releaseGate = resolve; });
      await gate;
      releaseGate = null;
      phase = 'released';
    },
    release(): boolean {
      if (phase !== 'holding' || releaseGate === null) return false;
      phase = 'release-requested';
      releaseGate();
      return true;
    },
    diagnostics,
  });
}
