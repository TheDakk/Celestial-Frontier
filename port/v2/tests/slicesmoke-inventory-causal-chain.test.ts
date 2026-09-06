import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assessArc2InventorySuccessorBoundary } from '../tools/slicesmoke-contract.mjs';
// @ts-expect-error This executable JavaScript helper is not included in the partial declaration shim.
import { assessInventoryPanelClose } from '../tools/slicesmoke-contract.mjs';

interface OpenerPoint {
  ok: boolean; x: number; y: number; targetId: string | null;
  buttonId: string | null; buttonTag: string | null;
}
interface OpenerPointer {
  targetId: string | null; tag: string | null; buttonId: string | null; buttonTag: string | null;
  x: number; y: number; trusted: boolean; pointerType: string | null;
}
interface OpenerTestWindow {
  document: Document; eval(source: string): unknown; close(): void;
  MouseEvent: typeof MouseEvent; __cfPanelPointer?: OpenerPointer;
}
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options: Record<string, unknown>) => { window: OpenerTestWindow };
};

const source = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);
const contractSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke-contract.mjs', import.meta.url)),
  'utf8',
);
const reportSource = readFileSync(
  fileURLToPath(new URL('../tools/smokereport.mjs', import.meta.url)),
  'utf8',
);

const OWNER_START = '  /* ARC 2 INVENTORY: use the veteran import\'s real current-v5 carrier and\n';
const OWNER_END = '  /* ARC 3 ENGINEERING ACTIONS. Replace the inventory fixture with one exact\n';
const RELOAD_ASSESSOR_START = 'const assessArc2InventoryReload = (';
const RELOAD_ASSESSOR_END = 'const assessArc2BootstrapRefusal = (';

const REQUIRED_OWNER_BINDINGS = [
  ['Arc 2 finding-count baseline',
    'const inventoryFindingCountBefore = fails.length;'],
  ['immutable receipt prefix decision',
    'const inventoryReceiptPrefixGreen = inventoryReceiptPrefixSeed?.schema === \'cf-v2-f4-smoke-outcome/v1\''],
  ['immutable receipt prefix root-red abort guard',
    'if (!inventoryReceiptPrefixGreen) {'],
  ['immutable receipt prefix terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY RECEIPT PREFIX SETUP: red immutable predecessor stopped all dependent Inventory and mutable successor judgments'"],
  ['post-scroll rendering settlement',
    'await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(resolve,0)));'],
  ['exact row reachability decision',
    'const assessment = assessInventoryRowReachability(observation, instanceId);'],
  ['exact portable-v5 operation fixture',
    'const inventoryFixtureGreen = !!inventoryFixture.selectedInstanceId'],
  ['fixture finding owns the exact red',
    "fails.push('ARC 2 INVENTORY FIXTURE: portable-v5 veteran did not expose exact thermal/hazmat/pending-rig capacity truth: '"],
  ['row observation attached to semantic surface',
    'inventorySurface.rowReachability = inventoryRowTarget?.observation ?? null;'],
  ['surface causal prefix',
    "const surfacePrefix = assessInventoryStagePrefix('surface', {"],
  ['surface root-red abort guard',
    'if (!surfacePrefix.ok) {'],
  ['surface assessment requires row-green',
    'if (inventoryOpened && inventoryRowTarget?.ok === true) {'],
  ['surface Close is independently assessed',
    'inventorySurfaceCloseAssessment = assessInventoryDetailClose({'],
  ['unreleased surface modal terminates mutable successors',
    'if (inventorySurfaceCloseAssessment?.ok !== true) {'],
  ['unreleased surface modal terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY SURFACE: detail ownership was not released; mutable downstream arcs were not started'"],
  ['surface controls require a green base',
    'if (inventorySurfaceAssessment?.ok === true && inventoryDetail && inventoryClosed && inventorySurface.rows.length) {'],
  ['action causal prefix',
    "const inventoryActionPrefix = assessInventoryStagePrefix('action', {"],
  ['action requires its green prefix',
    'if (inventoryActionPrefix.ok) {'],
  ['action reopen root-red abort guard',
    'if (!actionRowPoint.ok) {'],
  ['action controls causal prefix',
    "const inventoryActionControlPrefix = assessInventoryStagePrefix('action-controls', {"],
  ['action controls require a green base',
    'if (inventoryActionControlPrefix.ok) {'],
  ['red action cleanup is explicit',
    'const inventoryActionNeedsRedCleanup = !inventoryActionControlPrefix.ok;'],
  ['red action waits for quiescence',
    'if (inventoryActionNeedsRedCleanup) {'],
  ['pending red action terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY ACTION: red action retained pending work; mutable downstream arcs were not started'"],
  ['unreleased action modal terminates mutable successors',
    'if (!inventoryActionCloseGreen) {'],
  ['unreleased action modal terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY ACTION CLOSE: modal ownership was not released; mutable downstream arcs were not started'"],
  ['cleaned red action still terminates mutable successors',
    'const inventoryActionMustTerminate = inventoryActionNeedsRedCleanup;'],
  ['cleaned red action termination guard',
    'if (inventoryActionMustTerminate) {'],
  ['cleaned red action terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY ACTION: red committed-state evidence was cleaned up; mutable downstream arcs were not started'"],
  ['native pre-durable authority boundary',
    'const refusalArmed = await evalIn(`window.__CF_SLICE__.api.__smokeForceReadOnly(true)`);'],
  ['native pre-durable activation',
    'const refusalPoint = await inventoryActionButtonPoint(refusalOperation, inventoryInstanceId);'],
  ['native pre-durable action follows the open detail',
    "const refusalOperation = refusalOpenedDetail?.actions?.includes('unequip') ? 'unequip'"],
  ['pre-durable refusal contract',
    'const refusalAssessment = assessArc2InventoryPreDurableRefusal(refusalBundle);'],
  ['pre-durable boundary release',
    'const refusalReleased = await evalIn(`window.__CF_SLICE__.api.__smokeForceReadOnly(false)`);'],
  ['operation-parametric native owner',
    'const runArc2InventoryOperation = async ({ operation, instanceId, expectedCargoDelta = {} }) => {'],
  ['operation uses shared F4 hold',
    'const holdArmed = await evalIn(`window.__CF_SLICE__.api.__smokeArmProductActionHold()`);'],
  ['Salvage owns exact confirmation boundary',
    "const confirmation = await waitDesktopValue('Arc 2 Salvage native confirmation'"],
  ['held operation contract',
    'const pendingAssessment = assessArc2InventoryPendingWindow(pendingBundle);'],
  ['disabled native retry target',
    'const retryPoint = await inventoryActionButtonPoint(operation, instanceId, true);'],
  ['disabled native retry attempt',
    'const retryDispatch = retryPoint?.ok ? await clickDesktopPoint(retryPoint) : null;'],
  ['disabled retry dispatch bound to evidence',
    'const retry = { ...retryPresses, dispatch: retryDispatch };'],
  ['shared hold release',
    'const released = await evalIn(`window.__CF_SLICE__.api.__smokeReleaseProductActionHold()`);'],
  ['durable operation contract',
    'const outcomeAssessment = assessArc2InventoryOperationOutcome(outcomeBundle);'],
  ['exact durable operation ledger append',
    'inventoryOperationLedger.push(ledgerEntry);'],
  ['exact four-operation order guard',
    "!== canonicalJson(['equip', 'unequip', 'salvage', 'pending-claim'])) {"],
  ['reload causal prefix',
    "const inventoryReloadPrefix = assessInventoryStagePrefix('reload', {"],
  ['reload requires its complete green prefix',
    'if (inventoryReloadPrefix.ok && inventoryCommittedRaw && inventoryCommittedState) {'],
  ['reload opener root-red abort guard',
    'if (!inventoryReloadOpened) {'],
  ['reload opener terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY RELOAD: panel opener failed; dependent Close and Atlas judgments were not started'"],
  ['reload panel Close is independently assessed',
    'const inventoryReloadCloseAssessment = assessInventoryPanelClose({'],
  ['reload panel Close root-red abort guard',
    'if (!inventoryReloadCloseAssessment.ok) {'],
  ['reload panel Close terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY RELOAD CLOSE: panel ownership was not released; dependent Atlas and mutable successor judgments were not started'"],
  ['reload Atlas root-red abort guard',
    'if (!atlasPreClick.ok || !atlasOpened) {'],
  ['reload Atlas terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY ATLAS CONTINUITY: Atlas prerequisite failed; dependent reload judgment was not started'"],
  ['reload semantic root-red abort guard',
    'if (!reloadAssessment.ok) {'],
  ['reload semantic terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY RELOAD/ATLAS: red durable reload state stopped mutable successor arcs'"],
  ['detail Close controls require committed green action',
    'if (inventoryActionControlPrefix.ok && actionCloseAssessment.ok) {'],
  ['reload missing receipt-key control',
    'receiptMissingKey: reloadRawControl((reloaded) => {'],
  ['reload predecessor identity selection',
    '.findIndex((key) => !reloadOperationReceiptKeys.has(key));'],
  ['reload predecessor key-drift control',
    'receiptKeyDrift: reloadRawControl((reloaded) => {'],
  ['reload receipt-byte control',
    'receiptByteDrift: reloadRawControl((reloaded) => {'],
  ['reload receipt-semantic control',
    'receiptSemanticDrift: reloadRawControl((reloaded) => {'],
  ['reload F4 seed control',
    'authoritySeedDrift: mutateReloadAuthority((sessionRng) => {'],
  ['reload F4 ordinal control',
    'authorityOrdinalDrift: mutateReloadAuthority((sessionRng) => {'],
  ['reload F4 draw control',
    'authorityDrawDrift: mutateReloadAuthority((sessionRng) => {'],
  ['reload F4 control coherently updates runtime seed',
    'reloadedState.persistence.runtime.sessionSeed = reloaded.authority.sessionRng.seed;'],
  ['reload F4 control coherently updates runtime ordinal',
    'reloadedState.persistence.runtime.sessionOrdinal = reloaded.authority.sessionRng.ordinal;'],
  ['reload F4 control coherently updates runtime draws',
    'reloadedState.persistence.runtime.sessionDraws = structuredClone(reloaded.authority.sessionRng.draws);'],
  ['reload controls require a green reload base',
    'if (reloadAssessment.ok) {'],
  ['durable reload controls own exact diagnosis',
    "? 'durable Arc 2 operation ledger/F4 authority reload'"],
  ['Arc 2 successor boundary decision',
    'const inventorySuccessorBoundary = assessArc2InventorySuccessorBoundary({'],
  ['Arc 2 successor boundary binds fixture',
    'fixtureGreen: inventoryFixtureGreen,'],
  ['Arc 2 successor boundary binds finding delta',
    'findingCountBefore: inventoryFindingCountBefore,\n    findingCountAfter: fails.length,'],
  ['Arc 2 red blocks mutable Arc 3',
    "failSliceWithoutCascade('ARC 2 INVENTORY TERMINAL BOUNDARY: red fixture or native outcome stopped mutable Arc 3 before its fixture import: '"],
] as const;

const REQUIRED_GLOBAL_BINDINGS = [
  ['row activation contract', 'const rowActivation = assessInventoryRowActivation({', 2],
  ['action activation contract', 'if (!assessInventoryActionActivation({ point, interaction }, instanceId).ok) {', 1],
  ['detail Close contracts', 'assessInventoryDetailClose({', 6],
  ['raw Close sheet presence', 'sheetPresent:!!sheet', 3],
  ['raw Close hidden state', 'hidden:sheet?.hidden', 3],
  ['raw Close aria state', "ariaHidden:sheet?.getAttribute('aria-hidden')??null", 4],
  ['raw Close panel presence', 'panelPresent:!!panel,panelDisplay:panel?.style.display??null', 3],
  ['raw Close panel display', 'panelDisplay:panel?.style.display??null', 3],
  ['raw Close panel ARIA and app state',
    "panelAriaHidden:panel?.getAttribute('aria-hidden')??null,panelOpen:S?.api?.state?.().panelOpen??null", 3],
  ['raw Close opener and expansion',
    "openerPresent:!!opener,inventoryExpanded:opener?.getAttribute('aria-expanded')??null", 3],
  ['raw Close inert state', 'panelInert:panel?panel.inert===true:null', 3],
  ['exact registered-panel Close receipt owner',
    "panelCloseOwner:panelClose?.getAttribute('data-pnx')||null", 1],
  ['raw registered-panel Close geometry',
    'x,y,width:r?.width||0,height:r?.height||0,\n          tag:button?.tagName||null,owner:button?.getAttribute(\'data-pnx\')||null', 1],
  ['raw registered-panel Close state',
    'panelPresent:!!panel,display:panel?.style.display??null', 1],
] as const;

const REQUIRED_RELOAD_ASSESSOR_BINDINGS = [
  ['shared operation-ledger reload durability contract', 'assessInventoryOperationSequenceDurability({'],
  ['committed runtime binding', 'committedRuntime: committedState?.persistence?.runtime'],
  ['reloaded runtime binding', 'reloadedRuntime: reloadedState?.persistence?.runtime'],
  ['exact operation ledger binding', '}, operations)'],
  ['invalid operation ledger fails closed', ": { ok: false, reasons: ['durable Arc 2 operation ledger/F4 authority reload'] };"],
  ['durability reasons are preserved', 'if (!reloadDurability.ok) reasons.push(...reloadDurability.reasons);'],
] as const;

const REQUIRED_CONTRACT_BINDINGS = [
  ['operation-ledger durability owner',
    'export function assessInventoryOperationSequenceDurability(observation, expectedOperations) {'],
  ['non-vacuous immutable predecessor',
    'const ok = committedKeys.length >= expectedOperations.length + 1'],
  ['exact receipt row/byte coherence',
    'const coherentRows = (evidence, keys) => keys.length === evidence?.receiptRawRows?.length'],
  ['contiguous ordinal/revision sequence',
    'const sequenceContiguous = expectedOperations.every((entry, index) => index === 0'],
  ['every operation binds exact receipt',
    'const ledgerBound = expectedOperations.every((entry) => {'],
  ['operation-specific exact witness',
    'const expectedWitness = `arc2:${entry.operation}:${entry.receiptOrdinal}:${entry.instanceId}:${entry.inventoryRevision}`;'],
  ['operation-specific receipt kind',
    'committedReceipt?.kind === `arc2-${entry.operation}`'],
  ['exact cross-reload receipt bytes and semantics',
    '&& coherentRows(committed, committedKeys) && coherentRows(reloaded, reloadedKeys)'],
  ['stable F4 runtime projections and ledger binding',
    'runtimeProjection(reloadedRuntime) === rngProjection(reloadedRng)\n    && sequenceContiguous && ledgerBound'],
  ['final ordinal follows exact ledger',
    'committedRng?.ordinal === last.receiptOrdinal + 1;'],
  ['focused durability diagnosis',
    "return { ok, reasons: ok ? [] : ['durable Arc 2 operation ledger/F4 authority reload'] };"],
  ['Arc 2 successor boundary owner',
    'export function assessArc2InventorySuccessorBoundary(observation) {'],
  ['Arc 2 fixture is independently required',
    "if (observation?.fixtureGreen !== true) reasons.push('exact Arc 2 fixture');"],
  ['Arc 2 native findings block successors',
    "reasons.push('zero Arc 2 findings');"],
  ['Arc 3 permission is explicit',
    'canEnterMutableArc3: ok,'],
] as const;

const REQUIRED_REPORT_BINDINGS = [
  ['volatile active-play green witness', '...committedAuthority, activePlayMs: 1300'],
  ['volatile runtime green witness', "revision: 12, commits: 8, documentToken: 'runtime-reloaded'"],
  ['missing predecessor control', "['missing-predecessor'"],
  ['predecessor byte control', "['predecessor-byte-drift'"],
  ['predecessor semantic control', "['predecessor-semantic-drift'"],
  ['coherent RNG control helper', 'const mutateReloadRngCoherently = (mutate) =>'],
] as const;

const FORBIDDEN_STALE_GUARDS = [
  'if (inventoryOpened && inventoryClosed?.open === false) {',
  'if (inventoryCommittedRaw && inventoryCommittedState) {',
  'if (Object.values(inventorySurfaceControls).some((control) => control.ok)) {',
  'if (Object.values(actionControls).some((control) => control.ok)) {',
  "fails.push('ARC 2 INVENTORY: real visible right-rail opener did not open the registered panel');",
  'surface.inventoryClose.settled.inventoryHidden = false',
  'if (actionCloseAssessment.ok) {',
] as const;

const ORDER_RULES = [
  ['row reveal precedes surface decision',
    'inventoryRowTarget = await inventoryRowPoint();',
    'inventorySurfaceAssessment = assessArc2InventorySurface(inventorySurfaceBundle);'],
  ['surface decision precedes action prefix',
    'inventorySurfaceAssessment = assessArc2InventorySurface(inventorySurfaceBundle);',
    "const inventoryActionPrefix = assessInventoryStagePrefix('action', {"],
  ['action prefix precedes action-control prefix',
    "const inventoryActionPrefix = assessInventoryStagePrefix('action', {",
    "const inventoryActionControlPrefix = assessInventoryStagePrefix('action-controls', {"],
  ['action-control prefix precedes reload prefix',
    "const inventoryActionControlPrefix = assessInventoryStagePrefix('action-controls', {",
    "const inventoryReloadPrefix = assessInventoryStagePrefix('reload', {"],
  ['committed Equip precedes refusal boundary',
    'inventoryOperationLedger.push(Object.freeze({\n          operation: \'equip\'',
    'const refusalArmed = await evalIn(`window.__CF_SLICE__.api.__smokeForceReadOnly(true)`);'],
  ['refusal settles before operation runner',
    'const refusalAssessment = assessArc2InventoryPreDurableRefusal(refusalBundle);',
    'const runArc2InventoryOperation = async ({ operation, instanceId, expectedCargoDelta = {} }) => {'],
  ['native Unequip precedes native Salvage',
    'const unequipped = await runArc2InventoryOperation({',
    'const salvaged = await runArc2InventoryOperation({'],
  ['native Salvage precedes native Pending Claim',
    'const salvaged = await runArc2InventoryOperation({',
    'const claimed = await runArc2InventoryOperation({'],
  ['native Pending Claim precedes exact ledger guard',
    'const claimed = await runArc2InventoryOperation({',
    "!== canonicalJson(['equip', 'unequip', 'salvage', 'pending-claim'])) {"],
  ['exact operation ledger precedes fresh reload',
    "!== canonicalJson(['equip', 'unequip', 'salvage', 'pending-claim'])) {",
    "const inventoryReloadPrefix = assessInventoryStagePrefix('reload', {"],
  ['reload evidence precedes the mutable-successor boundary',
    "const inventoryReloadPrefix = assessInventoryStagePrefix('reload', {",
    'const inventorySuccessorBoundary = assessArc2InventorySuccessorBoundary({'],
] as const;

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function inventoryOwner(candidate: string): string {
  const start = candidate.indexOf(OWNER_START);
  const end = candidate.indexOf(OWNER_END, start + OWNER_START.length);
  return start >= 0 && end > start ? candidate.slice(start, end) : '';
}

function exactSection(candidate: string, startNeedle: string, endNeedle: string): string {
  const start = candidate.indexOf(startNeedle);
  const end = candidate.indexOf(endNeedle, start + startNeedle.length);
  return start >= 0 && end > start ? candidate.slice(start, end) : '';
}

function bindingErrors(candidate: string, bindings: ReadonlyArray<readonly [string, string]>): string[] {
  return bindings.flatMap(([label, binding]) => {
    const count = occurrences(candidate, binding);
    return count === 1 ? [] : [`${label}: expected one binding, got ${count}`];
  });
}

function reloadAssessorErrors(candidate: string): string[] {
  const errors = bindingErrors(candidate, REQUIRED_RELOAD_ASSESSOR_BINDINGS);
  if (candidate.includes('canonicalJson(operations?.map(({ operation }) => operation))')) {
    errors.push('operation order is duplicated outside the durability assessor');
  }
  return errors;
}

function ownerErrors(owner: string): string[] {
  const errors: string[] = [];
  if (!owner) errors.push('Inventory owner absent');
  for (const [label, binding] of REQUIRED_OWNER_BINDINGS) {
    const count = occurrences(owner, binding);
    if (count !== 1) errors.push(`${label}: expected one binding, got ${count}`);
  }
  for (const [label, first, second] of ORDER_RULES) {
    const firstCount = occurrences(owner, first);
    const secondCount = occurrences(owner, second);
    if (firstCount !== 1 || secondCount !== 1) {
      errors.push(`${label}: non-unique order fields (${firstCount}, ${secondCount})`);
    } else if (owner.indexOf(first) >= owner.indexOf(second)) errors.push(`${label}: reversed`);
  }
  for (const guard of FORBIDDEN_STALE_GUARDS) {
    if (owner.includes(guard)) errors.push(`stale causal guard survived: ${guard}`);
  }
  return errors;
}

describe('Slice Arc 2 Inventory causal interaction chain', () => {
  const owner = inventoryOwner(source);
  const reloadAssessor = exactSection(source, RELOAD_ASSESSOR_START, RELOAD_ASSESSOR_END);

  it('binds nested nameplate hits to their observed button without rewriting raw targets', async () => {
    const dom = new JSDOM('<header id="topbar"><button id="dockinventory"><span id="playerchip">Explorer</span></button><button id="dockrecords">Records</button></header>',
      { runScripts: 'outside-only' });
    const w = dom.window;
    try {
      const button = w.document.getElementById('dockinventory')!;
      const child = w.document.getElementById('playerchip')!;
      const other = w.document.getElementById('dockrecords')!;
      button.getBoundingClientRect = () => ({ left: 10, right: 230, top: 10, bottom: 54,
        width: 220, height: 44, x: 10, y: 10, toJSON: () => ({}) });
      let hit: Element = child;
      Object.defineProperty(w.document, 'elementFromPoint', { value: () => hit });
      const pointOwner = exactSection(source, '  const railButtonPoint = (id) =>',
        '  const openDesktopRailPanel = async');
      const pointExpression = Function(`${pointOwner}; return railButtonPoint;`)() as (id: string) => string;
      const point = w.eval(pointExpression('dockinventory')) as OpenerPoint;
      expect(point).toMatchObject({ ok: true, targetId: 'playerchip', buttonId: 'dockinventory', buttonTag: 'BUTTON' });
      hit = other;
      expect(w.eval(pointExpression('dockinventory'))).toMatchObject({ ok: false,
        targetId: 'dockrecords', buttonId: 'dockrecords' });
      hit = child;
      const pointerOwner = exactSection(source, '  const armDesktopPointerReceipt = async () =>',
        '  const takeDesktopPointerReceipt = async');
      const arm = Function('evalIn', `${pointerOwner}; return armDesktopPointerReceipt;`)(
        (expression: string) => w.eval(expression)) as () => Promise<unknown>;
      const press = async (target: Element): Promise<OpenerPointer> => {
        await arm();
        const event = new w.MouseEvent('pointerdown', { bubbles: true, clientX: point.x, clientY: point.y });
        Object.defineProperty(event, 'pointerType', { value: 'mouse' });
        target.dispatchEvent(event);
        const pointer = w.__cfPanelPointer;
        if (!pointer) throw new Error('pointer receipt missing');
        return pointer;
      };
      const receipt = await press(child);
      expect(receipt).toMatchObject({ targetId: 'playerchip', tag: 'SPAN',
        buttonId: 'dockinventory', buttonTag: 'BUTTON', trusted: false });
      expect(await press(other)).toMatchObject({ targetId: 'dockrecords', buttonId: 'dockrecords' });
      const surfaceOwner = exactSection(source, '  const openerPoint = surface?.opener?.preClick;',
        '  const selectedRow = surface?.rows?.find');
      const assess = Function('surface', `const reasons=[];${surfaceOwner};return reasons;`) as (surface: unknown) => string[];
      const surface = { opener: { id: 'dockinventory', tag: 'BUTTON', visible: true, preClick: point,
        pointer: { ...receipt, trusted: true } }, panelOpen: 'inventory', panelDirectCloseCount: 1, panelFocus: 'inventory' };
      expect(assess(surface)).toEqual([]);
      expect(assess({ ...surface, opener: { ...surface.opener, pointer: receipt } })).toEqual(['real Inventory opener/one-panel surface']);
      expect(assess({ ...surface, opener: { ...surface.opener, pointer: { ...surface.opener.pointer,
        buttonId: 'railinventory' } } })).toEqual(['real Inventory opener/one-panel surface']);
      expect(assess({ ...surface, opener: { ...surface.opener, preClick: { ...point,
        buttonId: 'dockrecords' } } })).toEqual(['real Inventory opener/one-panel surface']);
      expect(assess({ ...surface, opener: { ...surface.opener, pointer: { ...surface.opener.pointer,
        buttonTag: 'SPAN' } } })).toEqual(['real Inventory opener/one-panel surface']);
      expect(assess({ ...surface, opener: { ...surface.opener, pointer: { ...surface.opener.pointer,
        x: point.x + 2 } } })).toEqual(['real Inventory opener/one-panel surface']);
      expect(assess(surface)).toEqual([]);
    } finally { w.close(); }
  });

  it('uses the shelf Inventory owner through surface, operations, reload and exact focus restoration', () => {
    expect(owner).not.toContain("'railinventory'");
    expect(owner).toContain("railButtonPoint('dockinventory')");
    expect(owner).toContain("openDesktopRailPanel('dockinventory', 'inventory', 'ARC 2 INVENTORY')");
    expect(owner).toContain("openDesktopRailPanel('dockinventory', 'inventory', 'ARC 2 INVENTORY RELOAD')");
    expect(reloadAssessor).toContain("surface?.inventoryPointer?.buttonId !== 'dockinventory'");
    expect(reloadAssessor).toContain("surface?.inventoryPointer?.buttonTag !== 'BUTTON'");
    expect(reloadAssessor).toContain('!assessInventoryPanelClose(surface?.inventoryClose).ok');
    const fixtureOwner = exactSection(reportSource, '  const inventoryPanelClose = Object.freeze({',
      '  const inventoryPanelCloseControls = [');
    const fixture = Function(`${fixtureOwner};return inventoryPanelClose;`)() as {
      point: Record<string, unknown>; pointer: Record<string, unknown>;
      settled: Record<string, unknown> & { focusId: string };
    };
    expect(fixture.settled.focusId).toBe('dockinventory');
    expect(assessInventoryPanelClose(fixture)).toEqual({ ok: true, reasons: [] });
    expect(assessInventoryPanelClose({ ...fixture, settled: { ...fixture.settled,
      focusId: 'railinventory' } })).toEqual({ ok: false, reasons: ['closed panel/focus/zero ownership'] });
    expect(assessInventoryPanelClose(fixture)).toEqual({ ok: true, reasons: [] });
  });

  it('measures both real vertical rail gaps and rejects background hits, collapsed spacing and missing pointer ownership', () => {
    const owner = exactSection(source, '  const railGapProbe =', '  const railButtonPoint =');
    const probe = Function(`${owner};return railGapProbe;`)() as (root: string, upper: string, lower: string) => string;
    const make = (id: string, left: number, top: number, width = 140, height = 44) => ({ id,
      getBoundingClientRect: () => ({ left, right: left + width, top, bottom: top + height, width, height }),
      hasAttribute: () => true });
    const leftRail = make('raillft', 18, 130, 140, 96);
    const rightRail = make('railrgt', 1122, 130, 140, 96);
    const nodes = new Map([leftRail, rightRail,
      make('railcharters', 18, 130), make('railcodex', 18, 182),
      make('railatlas', 1122, 130), make('railshipyard', 1122, 182)].map(node => [node.id, node]));
    let hit: unknown = leftRail;
    let pointerEvents = 'auto';
    const document = { getElementById: (id: string) => nodes.get(id) ?? null, elementFromPoint: () => hit };
    const sample = (root: string, upper: string, lower: string) => Function('document', 'getComputedStyle', 'innerWidth', 'innerHeight', 'window',
      `return ${probe(root, upper, lower)};`)(document, () => ({ display: 'flex', pointerEvents }), 1280, 800,
      { __CF_SLICE__: { api: { state: () => ({ panelOpen: 'codex', cardOpen: false }) } } }) as {
        geometry: boolean; ownerId: string; gap: number; targetId: string | null; point: { x: number; y: number } };
    const pairs = [['raillft', 'railcharters', 'railcodex'], ['railrgt', 'railatlas', 'railshipyard']] as const;
    for (const [root, upper, lower] of pairs) {
      hit = nodes.get(root);
      expect(sample(root, upper, lower)).toMatchObject({ geometry: true, ownerId: root, gap: 8, targetId: root });
      hit = { id: 'game-canvas' };
      expect(sample(root, upper, lower).geometry).toBe(false);
      hit = nodes.get(root); pointerEvents = 'none';
      expect(sample(root, upper, lower).geometry).toBe(false);
      pointerEvents = 'auto';
      const original = nodes.get(lower)!;
      const rect = original.getBoundingClientRect();
      for (const mutant of [make(lower, rect.left, rect.top - 8),
        make(lower, rect.left + 8, rect.top), make(lower, rect.left, rect.top, rect.width, 43)]) {
        nodes.set(lower, mutant);
        expect(sample(root, upper, lower).geometry).toBe(false);
      }
      nodes.set(lower, original);
      expect(sample(root, upper, lower).geometry).toBe(true);
    }
    hit = leftRail;
    const leftPoint = sample(...pairs[0]).point;
    hit = rightRail;
    expect(leftPoint.x).toBeLessThan(sample(...pairs[1]).point.x);
  });

  it('opens the actual wide controls while keeping two measured rail gaps and removed-owner controls', () => {
    const gapOwner = exactSection(source, "  if (await openDesktopRailPanel('railcodex', 'codex', 'RIGHT RAIL GAP')) {",
      '  /* Search keeps its established outside-dismiss policy');
    expect(gapOwner).not.toContain("'railrecords'");
    expect(gapOwner).toContain("openDesktopRailPanel('dockrecords', 'rec', 'LEFT RAIL GAP')");
    expect(gapOwner).toContain("button=document.getElementById('dockrecords')");
    expect(gapOwner).toContain("railId: 'raillft', gapCheck: leftGap, buttonId: 'dockrecords', panelId: 'rec'");
    expect(gapOwner).toContain("openDesktopRailPanel('dockrecords', 'rec', 'PANEL NON-ELEMENT TARGET')");
    expect(gapOwner).toContain("receipt?.targetId !== 'raillft' || receipt?.trusted !== true");
    expect(gapOwner).toContain("receipt?.targetId !== 'railrgt' || receipt?.trusted !== true");
    expect(gapOwner).toContain("receipt?.targetId !== railId || receipt?.trusted !== true");
    expect(gapOwner).toContain("?.removeAttribute('data-panel-boundary')");
    expect(gapOwner).toContain("rail?.setAttribute('data-panel-boundary',prior)");
    expect(gapOwner).toContain('await clickDesktopPoint(before.point)');
    expect(source).toContain("const rightGap = railGapProbe('railrgt', 'railatlas', 'railshipyard')");
    expect(source).toContain("const leftGap = railGapProbe('raillft', 'railcharters', 'railcodex')");
    expect(source).toContain('Math.abs(gap-8)<=0.5');
    expect(source).toContain("style.pointerEvents==='auto'");
    expect(source).toContain("['raillft','railrgt'].includes(rail.id)");
    expect(source).toContain('&&hit===rail');
    expect(reloadAssessor).toContain("surface?.atlasPreClick?.buttonId !== 'railatlas'");
    expect(reloadAssessor).toContain("surface?.atlasPointer?.buttonId !== 'railatlas'");
    expect(reloadAssessor).toContain("surface?.atlasPointer?.buttonTag !== 'BUTTON'");
    expect(source).toContain("surface.atlasPreClick.buttonId = 'inventorypanel'");
    expect(source).toContain("surface.atlasPointer.buttonId = 'inventorypanel'");
    const openOwner = exactSection(source, '  const openDesktopRailPanel = async', '  const closeDesktopPanel = async');
    expect(openOwner).toContain('const point = await evalIn(railButtonPoint(buttonId))');
    expect(openOwner).toContain('if (!point.ok)');
    expect(openOwner).toContain('await clickDesktopPoint(point)');
    expect(openOwner).toContain('window.__CF_SLICE__.api.state().panelOpen===${JSON.stringify(panelId)}');
  });

  it('binds one settled row reveal to green-only surface, action, controls and reload stages', () => {
    expect(occurrences(source, OWNER_START)).toBe(1);
    expect(occurrences(source, OWNER_END)).toBe(1);
    expect(ownerErrors(owner)).toEqual([]);
    for (const [label, binding, count] of REQUIRED_GLOBAL_BINDINGS) {
      expect(occurrences(source, binding), label).toBe(count);
    }
    expect(reloadAssessorErrors(reloadAssessor)).toEqual([]);
    expect(bindingErrors(contractSource, REQUIRED_CONTRACT_BINDINGS)).toEqual([]);
    expect(bindingErrors(reportSource, REQUIRED_REPORT_BINDINGS)).toEqual([]);
    expect(contractSource).not.toContain('reloaded?.authorityJson === committed?.authorityJson');
    expect(source.indexOf('const inventorySuccessorBoundary = assessArc2InventorySuccessorBoundary({'))
      .toBeLessThan(source.indexOf('const engineeringImportToken = await sliceToken(sess);'));
  });

  it('blocks fixture and native Arc 2 reds before mutable Arc 3 while admitting only a clean stage', () => {
    expect(assessArc2InventorySuccessorBoundary({
      fixtureGreen: true, findingCountBefore: 7, findingCountAfter: 7,
    })).toEqual({ kind: 'ready', canEnterMutableArc3: true, reasons: [] });
    expect(assessArc2InventorySuccessorBoundary({
      fixtureGreen: false, findingCountBefore: 7, findingCountAfter: 7,
    })).toEqual({
      kind: 'blocked', canEnterMutableArc3: false, reasons: ['exact Arc 2 fixture'],
    });
    expect(assessArc2InventorySuccessorBoundary({
      fixtureGreen: true, findingCountBefore: 7, findingCountAfter: 8,
    })).toEqual({
      kind: 'blocked', canEnterMutableArc3: false, reasons: ['zero Arc 2 findings'],
    });
    expect(assessArc2InventorySuccessorBoundary({
      fixtureGreen: false, findingCountBefore: 7, findingCountAfter: 8,
    })).toEqual({
      kind: 'blocked', canEnterMutableArc3: false,
      reasons: ['exact Arc 2 fixture', 'zero Arc 2 findings'],
    });
    expect(assessArc2InventorySuccessorBoundary({
      fixtureGreen: true, findingCountBefore: 8, findingCountAfter: 7,
    })).toEqual({
      kind: 'blocked', canEnterMutableArc3: false,
      reasons: ['monotonic Arc 2 finding count'],
    });
  });

  it('makes removal of every causal owner binding focused red', () => {
    for (const [index, [label, binding]] of REQUIRED_OWNER_BINDINGS.entries()) {
      expect(occurrences(owner, binding), label).toBe(1);
      const marker = `__ARC2_INVENTORY_CAUSAL_MUTANT_${index}__`;
      const mutant = owner.replace(binding, marker);
      expect(mutant, label).not.toBe(owner);
      expect(ownerErrors(mutant), label).toContain(`${label}: expected one binding, got 0`);
    }
    for (const [index, [label, binding]] of REQUIRED_RELOAD_ASSESSOR_BINDINGS.entries()) {
      const marker = `__ARC2_RELOAD_ASSESSOR_MUTANT_${index}__`;
      const mutant = reloadAssessor.replace(binding, marker);
      expect(reloadAssessorErrors(mutant), label)
        .toContain(`${label}: expected one binding, got 0`);
    }
    for (const [index, [label, binding]] of REQUIRED_CONTRACT_BINDINGS.entries()) {
      const marker = `__ARC2_RELOAD_CONTRACT_MUTANT_${index}__`;
      const mutant = contractSource.replace(binding, marker);
      expect(bindingErrors(mutant, REQUIRED_CONTRACT_BINDINGS), label)
        .toContain(`${label}: expected one binding, got 0`);
    }
  });

  it('keeps operation-order diagnosis solely in the durable ledger assessor', () => {
    const duplicateDiagnosis = reloadAssessor.replace(
      '    || reloadedEntry?.instanceId !== committedEntry?.instanceId',
      "    || canonicalJson(operations?.map(({ operation }) => operation))\n"
        + "      !== canonicalJson(['equip', 'unequip', 'salvage', 'pending-claim'])\n"
        + '    || reloadedEntry?.instanceId !== committedEntry?.instanceId',
    );
    expect(duplicateDiagnosis).not.toBe(reloadAssessor);
    expect(reloadAssessorErrors(duplicateDiagnosis))
      .toContain('operation order is duplicated outside the durability assessor');
  });

  it('makes every causal stage reversal red while retaining both bindings', () => {
    for (const [index, [label, first, second]] of ORDER_RULES.entries()) {
      expect(occurrences(owner, first), label).toBe(1);
      expect(occurrences(owner, second), label).toBe(1);
      const marker = `__ARC2_INVENTORY_ORDER_MUTANT_${index}__`;
      const mutant = owner.replace(first, marker).replace(second, first).replace(marker, second);
      expect(ownerErrors(mutant), label).toContain(`${label}: reversed`);
    }
  });
});
