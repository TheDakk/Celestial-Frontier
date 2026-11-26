/* One product action at a time.

   A receipt-bearing action claims the page before its first await; while the claim is open a second press is
   refused, and ordinary checkpoints wait for it to settle. The claim is synchronous, so two presses in one frame
   cannot both pass. Ported from the painted port's `product-action-coordinator.ts` (its evidence hold and its
   notification hook are not carried: nothing here uses them). */

export interface ProductActionClaim {
  readonly operation: string;
  /** Ends the claim, exactly once. */
  settle(): void;
}

export interface ProductActionCoordinator {
  /** Null when another action already holds the page. */
  tryClaim(operation: string): ProductActionClaim | null;
  /** Resolves when no action holds the page. */
  idle(): Promise<void>;
  readonly busy: boolean;
  /** The action holding the page, or null. */
  readonly operation: string | null;
}

export function createProductActionCoordinator(): ProductActionCoordinator {
  let active: { readonly operation: string; readonly settled: Promise<void> } | null = null;

  return Object.freeze({
    tryClaim(operation: string): ProductActionClaim | null {
      if (typeof operation !== 'string' || operation.length < 1 || operation.length > 128) {
        throw new RangeError('Product action operation must contain 1 through 128 characters');
      }
      if (active !== null) return null;
      let release: () => void = () => undefined;
      const claim = { operation, settled: new Promise<void>((resolve) => { release = resolve; }) };
      active = claim;
      return Object.freeze({
        operation,
        settle(): void {
          if (active !== claim) throw new Error('Product action claim is no longer active');
          active = null;
          release();
        },
      });
    },
    async idle(): Promise<void> {
      while (active !== null) await active.settled;
    },
    get busy(): boolean { return active !== null; },
    get operation(): string | null { return active?.operation ?? null; },
  });
}
