import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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
  ['immutable receipt prefix decision',
    'const inventoryReceiptPrefixGreen = inventoryReceiptPrefixSeed?.schema === \'cf-v2-f4-smoke-outcome/v1\''],
  ['immutable receipt prefix root-red abort guard',
    'if (!inventoryReceiptPrefixGreen) {'],
  ['immutable receipt prefix terminator',
    "failSliceWithoutCascade('ARC 2 INVENTORY RECEIPT PREFIX SETUP: red immutable predecessor stopped all dependent Inventory and mutable successor judgments'"],
  ['post-scroll rendering settlement',
    'await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(resolve,0)));'],
  ['exact row reachability decision',
    'const assessment = assessInventoryRowReachability(observation, inventoryInstanceId);'],
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
    '.findIndex((key) => key !== reloadEquipReceiptKey);'],
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
    "? 'durable receipt/F4 authority reload'"],
] as const;

const REQUIRED_GLOBAL_BINDINGS = [
  ['row activation contract', 'const rowActivation = assessInventoryRowActivation({', 1],
  ['action activation contract', 'if (!assessInventoryActionActivation({ point, interaction }, instanceId).ok) {', 1],
  ['detail Close contracts', 'assessInventoryDetailClose({', 4],
  ['raw Close sheet presence', 'sheetPresent:!!sheet', 2],
  ['raw Close hidden state', 'hidden:sheet?.hidden', 2],
  ['raw Close aria state', "ariaHidden:sheet?.getAttribute('aria-hidden')??null", 2],
  ['raw Close panel presence', 'panelPresent:!!panel,panelDisplay:panel?.style.display??null', 2],
  ['raw Close panel display', 'panelDisplay:panel?.style.display??null', 2],
  ['raw Close panel ARIA and app state',
    "panelAriaHidden:panel?.getAttribute('aria-hidden')??null,panelOpen:S?.api?.state?.().panelOpen??null", 2],
  ['raw Close opener and expansion',
    "openerPresent:!!opener,inventoryExpanded:opener?.getAttribute('aria-expanded')??null", 2],
  ['raw Close inert state', 'panelInert:panel?panel.inert===true:null', 2],
  ['exact registered-panel Close receipt owner',
    "panelCloseOwner:panelClose?.getAttribute('data-pnx')||null", 1],
  ['raw registered-panel Close geometry',
    'x,y,width:r?.width||0,height:r?.height||0,\n          tag:button?.tagName||null,owner:button?.getAttribute(\'data-pnx\')||null', 1],
  ['raw registered-panel Close state',
    'panelPresent:!!panel,display:panel?.style.display??null', 1],
] as const;

const REQUIRED_RELOAD_ASSESSOR_BINDINGS = [
  ['shared reload durability contract', 'assessInventoryReloadDurability({'],
  ['committed runtime binding', 'committedRuntime: committedState?.persistence?.runtime'],
  ['reloaded runtime binding', 'reloadedRuntime: reloadedState?.persistence?.runtime'],
  ['invalid revision fails closed', ": { ok: false, reasons: ['durable receipt/F4 authority reload'] };"],
  ['durability reasons are preserved', 'if (!reloadDurability.ok) reasons.push(...reloadDurability.reasons);'],
] as const;

const REQUIRED_CONTRACT_BINDINGS = [
  ['non-vacuous predecessor plus Equip receipts',
    'committedKeys.length >= 2 && reloadedKeys.length >= 2'],
  ['exact receipt-key parity',
    'canonicalJson(reloadedKeys) === canonicalJson(committedKeys)'],
  ['exact receipt-byte parity',
    'canonicalJson(reloaded?.receiptRawRows) === canonicalJson(committed?.receiptRawRows)'],
  ['exact receipt-semantic parity',
    'canonicalJson(reloaded?.receiptRows) === canonicalJson(committed?.receiptRows)'],
  ['authority version coherence',
    'committed?.authorityVersion === 1 && reloaded?.authorityVersion === 1'],
  ['committed authority raw coherence',
    'committed?.authorityJson === JSON.stringify(committed?.authority)'],
  ['reloaded authority raw coherence',
    'reloaded?.authorityJson === JSON.stringify(reloaded?.authority)'],
  ['stable cross-reload RNG projection',
    'rngProjection(reloadedRng) === rngProjection(committedRng)'],
  ['committed runtime projection',
    'runtimeProjection(committedRuntime) === rngProjection(committedRng)'],
  ['reloaded runtime projection',
    'runtimeProjection(reloadedRuntime) === rngProjection(reloadedRng)'],
  ['authority-derived Equip key',
    'const expectedReceiptKey = expectedReceiptOrdinal === null ? null : `receipt:${expectedReceiptOrdinal}`;'],
  ['exact Equip witness',
    'committedReceipt?.witness === expectedWitness && reloadedReceipt?.witness === expectedWitness'],
  ['exact committed Equip bytes',
    'committed?.receiptRawRows?.[committedReceiptIndex] === JSON.stringify(committedReceipt)'],
  ['exact reloaded Equip bytes',
    'reloaded?.receiptRawRows?.[reloadedReceiptIndex] === JSON.stringify(reloadedReceipt)'],
  ['draw-map shape',
    'const drawsAreObjects = !!(committedRng?.draws && typeof committedRng.draws === \'object\''],
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

  it('binds one settled row reveal to green-only surface, action, controls and reload stages', () => {
    expect(occurrences(source, OWNER_START)).toBe(1);
    expect(occurrences(source, OWNER_END)).toBe(1);
    expect(ownerErrors(owner)).toEqual([]);
    for (const [label, binding, count] of REQUIRED_GLOBAL_BINDINGS) {
      expect(occurrences(source, binding), label).toBe(count);
    }
    expect(bindingErrors(reloadAssessor, REQUIRED_RELOAD_ASSESSOR_BINDINGS)).toEqual([]);
    expect(bindingErrors(contractSource, REQUIRED_CONTRACT_BINDINGS)).toEqual([]);
    expect(bindingErrors(reportSource, REQUIRED_REPORT_BINDINGS)).toEqual([]);
    expect(contractSource).not.toContain('reloaded?.authorityJson === committed?.authorityJson');
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
      expect(bindingErrors(mutant, REQUIRED_RELOAD_ASSESSOR_BINDINGS), label)
        .toContain(`${label}: expected one binding, got 0`);
    }
    for (const [index, [label, binding]] of REQUIRED_CONTRACT_BINDINGS.entries()) {
      const marker = `__ARC2_RELOAD_CONTRACT_MUTANT_${index}__`;
      const mutant = contractSource.replace(binding, marker);
      expect(bindingErrors(mutant, REQUIRED_CONTRACT_BINDINGS), label)
        .toContain(`${label}: expected one binding, got 0`);
    }
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
