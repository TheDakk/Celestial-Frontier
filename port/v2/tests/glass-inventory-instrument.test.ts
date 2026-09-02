import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildInventoryActionOffscreenRestoreSource,
  buildInventoryActionSettlementSource,
  inventoryActionPendingOutcome,
  inventoryActionSettlementSnapshot,
  prepareInventoryActionOffscreen,
  restoreInventoryActionOffscreen,
  runInventoryOffscreenProbe,
  stopAfterRecordedProductOutcome,
} from '../tools/glassmatrix.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const glassPath = path.join(here, '..', 'tools', 'glassmatrix.mjs');
const viewport = { width: 1280, height: 720 };
type Rect = readonly [number, number, number, number];

function inventoryActionInstrumentBlock(source: string): string | null {
  const start = source.indexOf('const offscreenPrior = await evalIn(');
  const end = source.indexOf('const committedCarrier = await evalIn(', start);
  return start >= 0 && end > start ? source.slice(start, end) : null;
}

const exactAction = Object.freeze({
  operation: 'equip',
  instanceId: 'thermal:fixture',
  holdOperation: 'arc2.equip',
  holdSequence: 7,
  revision: 12,
});

const exactReceipt = Object.freeze({
  trusted: true,
  operation: exactAction.operation,
  instanceId: exactAction.instanceId,
  baseline: Object.freeze({ ok: true }),
});

const exactPendingState = Object.freeze({
  diagnostics: Object.freeze({ pendingWork: 1 }),
  coordinator: Object.freeze({
    inFlight: true,
    owner: Object.freeze({ busy: true, operation: exactAction.holdOperation }),
    hold: Object.freeze({
      phase: 'holding', operation: exactAction.holdOperation, sequence: exactAction.holdSequence,
    }),
  }),
});

function pendingActionOutcome({
  receipt = exactReceipt,
  actionState = exactPendingState,
}: {
  receipt?: typeof exactReceipt | null | { readonly baseline: { readonly ok: boolean } } & Omit<typeof exactReceipt, 'baseline'>;
  actionState?: {
    readonly diagnostics: { readonly pendingWork: number };
    readonly coordinator: {
      readonly inFlight: boolean;
      readonly owner: { readonly busy: boolean; readonly operation: string };
      readonly hold: {
        readonly phase: string;
        readonly operation: string | null;
        readonly sequence: number;
      };
    };
  };
} = {}) {
  return inventoryActionPendingOutcome({
    preActionInstrumentControl: { ok: true, diagnostic: 'retained-pre-action-green' },
    realAction: { ok: true, inputDispatched: true },
    receipt,
    actionState,
    expectedOperation: exactAction.operation,
    expectedInstanceId: exactAction.instanceId,
    expectedHoldOperation: exactAction.holdOperation,
    expectedHoldSequence: exactAction.holdSequence,
  });
}

function terminalDiagnostics(kind = 'committed', detail = 'revision:12') {
  return {
    schema: 'cf-v2-inventory-sheet-diagnostics/v1',
    activeCount: 1,
    retainedCount: 0,
    pendingWork: 0,
    selectedInstanceId: exactAction.instanceId,
    lastAction: {
      operation: exactAction.operation,
      instanceId: exactAction.instanceId,
      kind,
      detail,
    },
  };
}

function terminalState({
  revision = exactAction.revision,
  equippedBindings = [{ slot: 'suit', instanceId: exactAction.instanceId }],
  mutationBlocked = false,
  leaseOwned = true,
}: {
  revision?: number;
  equippedBindings?: Array<{ slot: string; instanceId: string }>;
  mutationBlocked?: boolean;
  leaseOwned?: boolean;
} = {}) {
  return {
    inventory: {
      revision,
      entryIds: [exactAction.instanceId],
      equippedBindings,
      pendingIds: [],
    },
    engineering: {
      actionCoordinator: {
        inFlight: false,
        owner: { busy: false, operation: null },
        hold: {
          phase: 'released',
          operation: exactAction.holdOperation,
          sequence: exactAction.holdSequence,
        },
      },
    },
    persistence: {
      mutationBlocked,
      hold: mutationBlocked ? 'transient-read' : null,
      protectedDetail: mutationBlocked ? 'write authority changed' : null,
      runtime: { leaseOwned, revision },
    },
    sceneResources: { pendingPersistenceWrites: 0 },
  };
}

function makeHarness({
  saved,
  scrollRect,
  translatedRect,
  priorStyle = 'color: rgb(1, 2, 3); transform: scale(1)',
  priorTransform = 'scale(1)',
  priorTransformPriority = '',
  hit = null,
  stickyEmptyAfterFirstRemove = false,
}: {
  saved: number;
  scrollRect: Rect;
  translatedRect: Rect;
  priorStyle?: string | null;
  priorTransform?: string;
  priorTransformPriority?: string;
  hit?: object | null;
  stickyEmptyAfterFirstRemove?: boolean;
}) {
  let styleAttribute: string | null = priorStyle;
  let transform = priorTransform;
  let transformPriority = priorTransformPriority;
  let translated = false;
  let transformWrites = 0;
  let styleRemovals = 0;
  const style = {
    setProperty(name: string, value: string, priority = '') {
      if (name !== 'transform') throw new Error(`unexpected property ${name}`);
      transform = value;
      transformPriority = priority;
      translated = true;
      transformWrites += 1;
      styleAttribute = `transform: ${value}${priority ? ` !${priority}` : ''};`;
    },
    getPropertyValue(name: string) {
      return name === 'transform' ? transform : '';
    },
    getPropertyPriority(name: string) {
      return name === 'transform' ? transformPriority : '';
    },
  };
  const button = {
    isConnected: true,
    style,
    getBoundingClientRect() {
      const [left, top, right, bottom] = translated ? translatedRect : scrollRect;
      return { left, top, right, bottom };
    },
    getAttribute(name: string) {
      return name === 'style' ? styleAttribute : null;
    },
    setAttribute(name: string, value: string) {
      if (name !== 'style') throw new Error(`unexpected attribute ${name}`);
      styleAttribute = value;
      transform = priorTransform;
      transformPriority = priorTransformPriority;
      translated = false;
    },
    removeAttribute(name: string) {
      if (name !== 'style') throw new Error(`unexpected attribute ${name}`);
      styleRemovals += 1;
      styleAttribute = stickyEmptyAfterFirstRemove && styleRemovals === 1 ? '' : null;
      transform = '';
      transformPriority = '';
      translated = false;
    },
  };
  const card = {
    isConnected: true,
    scrollTop: saved,
    contains(node: unknown) { return node === button; },
  };
  const prior = {
    ok: true,
    saved,
    styleAttribute: priorStyle,
    transform: priorTransform,
    transformPriority: priorTransformPriority,
  };
  return {
    button,
    card,
    prior,
    hitTest: () => hit,
    transformWriteCount: () => transformWrites,
    styleRemovalCount: () => styleRemovals,
  };
}

async function exerciseHarness(
  harness: ReturnType<typeof makeHarness>,
  activate: () => unknown | Promise<unknown>,
) {
  return runInventoryOffscreenProbe({
    setup: () => prepareInventoryActionOffscreen(
      harness.button, harness.card, harness.prior, viewport, harness.hitTest,
    ),
    activate,
    restore: (setup: { mutationApplied?: boolean } | null, setupError: string | null) => (
      restoreInventoryActionOffscreen(
        harness.button, harness.card, harness.prior,
        setupError !== null || setup?.mutationApplied === true,
      )
    ),
  });
}

describe('Glass Inventory offscreen action instrument', () => {
  it('uses natural scroll only after it independently proves a full offscreen/null-hit target', async () => {
    const harness = makeHarness({
      saved: 240,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: false, inputDispatched: false, receipt: null };
    });

    expect(result.offscreenSetup).toMatchObject({ ok: true, mode: 'scroll', translated: false });
    expect(result.offscreenSetup?.target).toMatchObject({ fullyOutside: true, hit: null });
    expect(result.probeAttempted).toBe(true);
    expect(activations).toBe(1);
    expect(harness.transformWriteCount()).toBe(0);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 240, styleRestored: true });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
  });

  it('falls back to an important translation when natural scrolling is insufficient', async () => {
    const harness = makeHarness({
      saved: 240,
      scrollRect: [40, 120, 100, 176],
      translatedRect: [40, 848, 100, 904],
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: false, inputDispatched: false, receipt: null };
    });

    expect(result.offscreenSetup).toMatchObject({
      ok: true,
      mode: 'translated',
      translated: true,
      appliedTransformPriority: 'important',
    });
    expect(result.offscreenSetup?.scrollTarget).toMatchObject({ fullyOutside: false });
    expect(result.offscreenSetup?.target).toMatchObject({ fullyOutside: true, hit: null });
    expect(activations).toBe(1);
    expect(harness.transformWriteCount()).toBe(1);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 240, styleRestored: true });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
  });

  it.each([
    { label: 'absent', priorStyle: null, stickyEmptyAfterFirstRemove: true },
    { label: 'empty', priorStyle: '', stickyEmptyAfterFirstRemove: false },
  ])('uses the translated zero-scroll path and restores an $label style exactly', async ({
    priorStyle, stickyEmptyAfterFirstRemove,
  }) => {
    const harness = makeHarness({
      saved: 0,
      scrollRect: [40, 120, 100, 176],
      translatedRect: [40, 848, 100, 904],
      priorStyle,
      priorTransform: '',
      stickyEmptyAfterFirstRemove,
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: false, inputDispatched: false, receipt: null };
    });

    expect(result.offscreenSetup).toMatchObject({ ok: true, mode: 'translated', translated: true });
    expect(activations).toBe(1);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 0, styleAttribute: priorStyle });
    expect(harness.button.getAttribute('style')).toBe(priorStyle);
    expect(harness.styleRemovalCount()).toBe(priorStyle === null ? 2 : 0);
  });

  it('attempts zero activation and still restores when translated geometry stays reachable', async () => {
    const harness = makeHarness({
      saved: 0,
      scrollRect: [40, 120, 100, 176],
      translatedRect: [40, 120, 100, 176],
      hit: { tagName: 'BUTTON' },
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: true, inputDispatched: true };
    });

    expect(result.offscreenSetup).toMatchObject({ ok: false, mode: 'translated' });
    expect(result.probeAttempted).toBe(false);
    expect(result.offscreenProbe).toBeNull();
    expect(activations).toBe(0);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 0, styleRestored: true });
  });

  it('rejects stale ownership before mutation or activation', async () => {
    const harness = makeHarness({
      saved: 80,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    harness.card.scrollTop = 79;
    let activations = 0;
    const result = await exerciseHarness(harness, () => { activations += 1; });

    expect(result.offscreenSetup).toMatchObject({ ok: false, why: 'invalid offscreen setup owner' });
    expect(result.probeAttempted).toBe(false);
    expect(activations).toBe(0);
    expect(harness.transformWriteCount()).toBe(0);
    expect(result.restored).toMatchObject({
      ok: false, mutationApplied: false, scrollTop: 79, styleRestored: true,
    });
    expect(harness.card.scrollTop).toBe(79);
  });

  it('restores exact state after an activation error and retains the causal error', async () => {
    const harness = makeHarness({
      saved: 80,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    const result = await exerciseHarness(harness, () => {
      throw new Error('activation exploded');
    });

    expect(result.probeAttempted).toBe(true);
    expect(result.probeError).toBe('activation exploded');
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 80, styleRestored: true });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
  });

  it('builds executable browser restoration source and restores the retained exact owner', () => {
    const harness = makeHarness({
      saved: 80,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    harness.card.scrollTop = 0;
    harness.button.style.setProperty('transform', 'translateY(calc(100vh + 128px))', 'important');
    const pageWindow: Record<string, unknown> = {
      __cfInventoryOffscreenOwner: { button: harness.button, card: harness.card },
    };
    const source = buildInventoryActionOffscreenRestoreSource(harness.prior, true);
    const execute = new Function('window', `return ${source};`);
    const result = execute(pageWindow);

    expect(result).toMatchObject({ ok: true, mutationApplied: true, scrollTop: 80 });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
    expect('__cfInventoryOffscreenOwner' in pageWindow).toBe(false);
  });

  it('keeps missing receipts and red pending baselines red after retaining green setup diagnostics', () => {
    const missingReceipt = pendingActionOutcome({ receipt: null });
    const redBaseline = pendingActionOutcome({
      receipt: { ...exactReceipt, baseline: { ok: false } },
    });

    expect(missingReceipt).toMatchObject({
      diagnostic: 'retained-pre-action-green',
      productPrerequisite: false,
      ok: false,
      checks: { instrumentReady: true, trustedReceipt: false, pendingBaseline: false },
    });
    expect(redBaseline).toMatchObject({
      diagnostic: 'retained-pre-action-green',
      productPrerequisite: true,
      pendingOwnerExact: true,
      ok: false,
      checks: { instrumentReady: true, trustedReceipt: true, pendingBaseline: false },
    });
  });

  it('accepts only the fully exact trusted receipt and held pending owner', () => {
    const exact = pendingActionOutcome();
    const staleSequence = pendingActionOutcome({
      actionState: {
        ...exactPendingState,
        coordinator: {
          ...exactPendingState.coordinator,
          hold: { ...exactPendingState.coordinator.hold, sequence: exactAction.holdSequence + 1 },
        },
      },
    });

    expect(exact).toMatchObject({
      diagnostic: 'retained-pre-action-green',
      productPrerequisite: true,
      pendingOwnerExact: true,
      ok: true,
      checks: {
        instrumentReady: true,
        nativeActivation: true,
        trustedReceipt: true,
        receiptOperation: true,
        receiptInstance: true,
        pendingBaseline: true,
        pendingObserved: true,
        actionOwnerInFlight: true,
        actionOwnerBusy: true,
        actionOwnerOperation: true,
        actionHoldPhase: true,
        actionHoldOperation: true,
        actionHoldSequence: true,
      },
    });
    expect(Object.values(exact.checks).every((value) => value === true)).toBe(true);
    expect(staleSequence).toMatchObject({
      ok: false,
      pendingOwnerExact: false,
      checks: { actionHoldSequence: false },
    });
  });

  it('keeps the pending verdict red for an exact sequence with the wrong hold phase or operation', () => {
    const wrongPhase = pendingActionOutcome({
      actionState: {
        ...exactPendingState,
        coordinator: {
          ...exactPendingState.coordinator,
          hold: { ...exactPendingState.coordinator.hold, phase: 'release-requested' },
        },
      },
    });
    const wrongOperation = pendingActionOutcome({
      actionState: {
        ...exactPendingState,
        coordinator: {
          ...exactPendingState.coordinator,
          hold: { ...exactPendingState.coordinator.hold, operation: 'arc4.capture' },
        },
      },
    });

    expect(wrongPhase).toMatchObject({
      ok: false,
      pendingOwnerExact: false,
      checks: { actionHoldPhase: false, actionHoldOperation: true },
    });
    expect(wrongOperation).toMatchObject({
      ok: false,
      pendingOwnerExact: false,
      checks: { actionHoldPhase: true, actionHoldOperation: false },
    });
  });

  it('retains a structured refused terminal with exact action, revision, binding, and authority evidence', () => {
    const diagnostics = terminalDiagnostics('refused', 'write-authority-changed');
    const state = terminalState({
      revision: exactAction.revision - 1,
      equippedBindings: [{ slot: 'suit', instanceId: 'prior:fixture' }],
      mutationBlocked: true,
      leaseOwned: false,
    });
    const refused = inventoryActionSettlementSnapshot(diagnostics, state, exactAction);

    expect(refused).toMatchObject({
      schema: 'cf-v2-glass-inventory-action-settlement/v1',
      terminal: true,
      observationComplete: true,
      ok: false,
      action: {
        operation: exactAction.operation,
        instanceId: exactAction.instanceId,
        kind: 'refused',
        detail: 'write-authority-changed',
      },
      inventory: {
        revision: exactAction.revision - 1,
        equippedBindings: [{ slot: 'suit', instanceId: 'prior:fixture' }],
      },
      authority: {
        persistence: {
          mutationBlocked: true,
          hold: 'transient-read',
          protectedDetail: 'write authority changed',
          runtime: { leaseOwned: false, revision: exactAction.revision - 1 },
        },
      },
      checks: {
        actionIdentity: true,
        terminalKind: true,
        pendingCleared: true,
        committed: false,
        revisionAdvanced: false,
        bindingPublished: false,
        persistenceWritable: false,
      },
    });
  });

  it('keeps a pending observation structured and red through JSON evidence retention', () => {
    const diagnostics = {
      ...terminalDiagnostics(),
      pendingWork: 1,
      lastAction: null,
    };
    const pending = inventoryActionSettlementSnapshot(
      diagnostics,
      terminalState({ revision: exactAction.revision - 1, equippedBindings: [] }),
      exactAction,
    );
    const retained = JSON.parse(JSON.stringify(pending));

    expect(pending).toMatchObject({ terminal: false, observationComplete: false, ok: false });
    expect(retained).toMatchObject({
      schema: 'cf-v2-glass-inventory-action-settlement/v1',
      terminal: false,
      observationComplete: false,
      ok: false,
      action: null,
      diagnostics: { pendingWork: 1, lastAction: null },
      inventory: { revision: exactAction.revision - 1, equippedBindings: [] },
      authority: {
        persistence: {
          mutationBlocked: false,
          runtime: { leaseOwned: true, revision: exactAction.revision - 1 },
        },
      },
      checks: { actionIdentity: false, terminalKind: false, pendingCleared: false },
    });
  });

  it('accepts one exact committed terminal and its released action hold', () => {
    const committed = inventoryActionSettlementSnapshot(
      terminalDiagnostics(), terminalState(), exactAction,
    );

    expect(committed).toMatchObject({
      terminal: true,
      observationComplete: true,
      ok: true,
      inventory: {
        revision: exactAction.revision,
        equippedBindings: [{ slot: 'suit', instanceId: exactAction.instanceId }],
      },
    });
    expect(Object.values(committed.checks).every((value) => value === true)).toBe(true);
  });

  it('keeps an otherwise committed and idle settlement red until the exact hold is released', () => {
    const releasedState = terminalState();
    const holding = inventoryActionSettlementSnapshot(terminalDiagnostics(), {
      ...releasedState,
      engineering: { actionCoordinator: {
        ...releasedState.engineering.actionCoordinator,
        hold: {
          ...releasedState.engineering.actionCoordinator.hold,
          phase: 'holding',
        },
      } },
    }, exactAction);
    const wrongOperation = inventoryActionSettlementSnapshot(terminalDiagnostics(), {
      ...releasedState,
      engineering: { actionCoordinator: {
        ...releasedState.engineering.actionCoordinator,
        hold: {
          ...releasedState.engineering.actionCoordinator.hold,
          operation: 'arc4.capture',
        },
      } },
    }, exactAction);

    expect(holding).toMatchObject({
      terminal: true,
      observationComplete: true,
      ok: false,
      checks: { committed: true, actionOwnerIdle: true, actionHoldReleased: false },
    });
    expect(wrongOperation).toMatchObject({
      terminal: true,
      observationComplete: true,
      ok: false,
      checks: { committed: true, actionOwnerIdle: true, actionHoldReleased: false },
    });
  });

  it('retains a committed UI terminal but keeps observing while the progression tail owns work', () => {
    const idleState = terminalState();
    const state = {
      ...idleState,
      engineering: { actionCoordinator: {
        ...idleState.engineering.actionCoordinator,
        inFlight: true,
        owner: { busy: true, operation: 'arc9.progression-refresh' },
      } },
    };
    const intermediate = inventoryActionSettlementSnapshot(
      terminalDiagnostics(), state, exactAction,
    );

    expect(intermediate).toMatchObject({
      terminal: true,
      observationComplete: false,
      ok: false,
      checks: { committed: true, actionOwnerIdle: false },
      authority: {
        actionCoordinator: {
          inFlight: true,
          owner: { busy: true, operation: 'arc9.progression-refresh' },
        },
      },
    });
  });

  it('builds executable browser settlement source from the same structured projector', () => {
    const diagnostics = terminalDiagnostics();
    const state = terminalState();
    const pageWindow = {
      __CF_SLICE__: {
        api: {
          inventoryDiagnostics: () => diagnostics,
          state: () => state,
        },
      },
    };
    const source = buildInventoryActionSettlementSource(exactAction);
    const execute = new Function('window', `return ${source};`);

    expect(execute(pageWindow)).toEqual(
      inventoryActionSettlementSnapshot(diagnostics, state, exactAction),
    );
  });

  it('causal-stops red pending evidence before settlement and permits the green control', () => {
    const redTrace: string[] = [];
    const redOutcomes = [
      pendingActionOutcome({ receipt: null }),
      pendingActionOutcome({ receipt: { ...exactReceipt, baseline: { ok: false } } }),
    ];
    for (const outcome of redOutcomes) {
      expect(() => {
        stopAfterRecordedProductOutcome(
          'small-phone', 'inventory-action-pending', 'INVENTORY_ACTION_NO_OPTIMISM',
          '#inventorysheet [data-inventory-action="equip"]', outcome, 'exact pending owner',
        );
        redTrace.push('dependent-settlement-ran');
      }).toThrow(/INVENTORY_ACTION_NO_OPTIMISM was red/u);
    }
    expect(redTrace).toEqual([]);

    const greenTrace: string[] = [];
    expect(() => {
      stopAfterRecordedProductOutcome(
        'small-phone', 'inventory-action-pending', 'INVENTORY_ACTION_NO_OPTIMISM',
        '#inventorysheet [data-inventory-action="equip"]',
        pendingActionOutcome(), 'exact pending owner',
      );
      greenTrace.push('dependent-settlement-ran');
    }).not.toThrow();
    expect(greenTrace).toEqual(['dependent-settlement-ran']);
  });

  it('keeps setup, refusal-only input assessment, restoration, and classification before product input', () => {
    const source = fs.readFileSync(glassPath, 'utf8');
    const block = inventoryActionInstrumentBlock(source);
    expect(block).not.toBeNull();
    expect(block).toContain('const offscreenRun = await runInventoryOffscreenProbe({');
    expect(block).toContain('prepare=${PREPARE_INVENTORY_ACTION_OFFSCREEN_SOURCE}');
    expect(block).toContain('{ dispatch: false }');
    expect(block).toContain('evalIn(buildInventoryActionOffscreenRestoreSource(');
    expect(block).not.toContain("${'${JSON.stringify(");
    expect(block).toContain('offscreenRun.probeAttempted === true');
    expect(block).toContain('offscreenRun.offscreenProbe?.inputDispatched === false');
    expect(block).toContain('offscreenRun.offscreenProbe?.target?.receiptListenerArmed === false');
    expect(block).toContain('offscreenRun.restored.styleRestored === true');
    expect(block?.indexOf('Inventory action setup/offscreen control failed')).toBeLessThan(
      block?.indexOf('const realAction = await activateRealControl(') ?? -1,
    );
    expect(block).toContain('const actionControlCore = inventoryActionPendingOutcome({');
    expect(block).toContain('const pendingObservation = await observeOutcome(');
    expect(block).toContain('holdContaminated=!holdSequenceExact');
    expect(block).toContain("pendingObservation.value?.holdContaminated === true");
    expect(block).toContain('expectedHoldSequence: actionArm.hold.sequence');
    expect(block).toContain('const actionReleaseControl = {');
    expect(block).toContain('const publicationInstrumentError = actionControlCore.productPrerequisite');
    expect(block).toContain('Inventory publication control plumbing failed');
    expect(block).toContain('if (actionControlCore.productPrerequisite');
    expect(block).not.toContain('if (!inventoryControlRun && actionControlCore.productPrerequisite');
    expect(block).toContain('const settlementObservation = await observeOutcome(');
    expect(block).toContain('buildInventoryActionSettlementSource(settlementExpected)');
    expect(block).toContain('(value) => value?.observationComplete === true');
    expect(block).toContain('const settledAction = settlementObservation.value ?? {');
    expect(block).not.toContain("waitFor('Inventory action settlement'");

    const pendingOutcome = block?.indexOf('const pendingOutcome = {') ?? -1;
    const pendingAdd = block?.indexOf("addOutcome(vp.label, 'inventory-action-pending'") ?? -1;
    const pendingStop = block?.indexOf(
      "stopAfterRecordedProductOutcome(vp.label, 'inventory-action-pending'",
    ) ?? -1;
    const settlementObservation = block?.indexOf(
      'const settlementObservation = await observeOutcome(',
    ) ?? -1;
    const settlementAdd = block?.indexOf(
      "addOutcome(vp.label, 'inventory-action-settled'",
    ) ?? -1;
    expect(pendingOutcome).toBeGreaterThanOrEqual(0);
    expect(pendingAdd).toBeGreaterThan(pendingOutcome);
    expect(pendingStop).toBeGreaterThan(pendingAdd);
    expect(settlementObservation).toBeGreaterThan(pendingStop);
    expect(settlementAdd).toBeGreaterThan(settlementObservation);
  });
});
