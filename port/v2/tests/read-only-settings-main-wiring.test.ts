import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assessWritableSettingPersistenceReceipt,
  assessWritableSettingsPersistenceChain,
  assessWritableSettingsQuietWindow,
  buildWritableSettingActionExpression,
  buildWritableSettingSnapshotExpression,
  WRITABLE_SETTINGS_CASES,
} from '../tools/slicesmoke-contract.mjs';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const sliceSource = readFileSync(new URL('../tools/slicesmoke.mjs', import.meta.url), 'utf8');
const contractSource = readFileSync(new URL('../tools/slicesmoke-contract.mjs', import.meta.url), 'utf8');

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  return at < 0 || stop < 0 ? '' : source.slice(at, stop);
}
function includesOrdered(source: string, markers: readonly string[]): boolean {
  let offset = 0;
  for (const marker of markers) {
    const at = source.indexOf(marker, offset);
    if (at < 0) return false;
    offset = at + marker.length;
  }
  return true;
}

const CASE_IDS = [
  'sound', 'volume', 'creature-voices', 'text-size', 'text-tone',
  'font', 'star-charts', 'visual-effects', 'screen-shake', 'motion', 'panel-tint',
] as const;
const WRITABLE_SETTINGS_ORIGINALS: Record<string, unknown> = {
  sound: true, volume: 0.37, 'creature-voices': true,
  'text-size': 'fs-lg', 'text-tone': 'tone-bright', font: 'font-mono',
  'star-charts': false, 'visual-effects': true, 'screen-shake': false,
  motion: -1, 'panel-tint': 0.55,
};
const EXPECTED_WRITABLE_SETTINGS_MANIFEST = [
  { id: 'sound', field: 'sndOn', durableField: 'snd', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '#setsnd' }, restore: { kind: 'click', selector: '#setsnd' }, restoreExpected: true },
  { id: 'volume', field: 'sfxVol', durableField: 'vol', persistenceMode: 'debounce',
    mutate: { kind: 'input', selector: '#setvol', value: 73 }, restore: { kind: 'input', selector: '#setvol', value: 37 }, restoreExpected: 0.37 },
  { id: 'creature-voices', field: 'voiceOn', durableField: 'vce', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '#setvoice' }, restore: { kind: 'click', selector: '#setvoice' }, restoreExpected: true },
  { id: 'text-size', field: 'fsMode', durableField: 'fs', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '[data-pref="size"][data-value=""]' },
    restore: { kind: 'click', selector: '[data-pref="size"][data-value="fs-lg"]' }, restoreExpected: 'fs-lg' },
  { id: 'text-tone', field: 'toneMode', durableField: 'tone', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '[data-pref="tone"][data-value=""]' },
    restore: { kind: 'click', selector: '[data-pref="tone"][data-value="tone-bright"]' }, restoreExpected: 'tone-bright' },
  { id: 'font', field: 'fontMode', durableField: 'font', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '[data-pref="font"][data-value=""]' },
    restore: { kind: 'click', selector: '[data-pref="font"][data-value="font-mono"]' }, restoreExpected: 'font-mono' },
  { id: 'star-charts', field: 'chartsOn', durableField: 'chart', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '#setcharts' }, restore: { kind: 'click', selector: '#setcharts' }, restoreExpected: false },
  { id: 'visual-effects', field: 'fxOn', durableField: 'fx', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '#setfx' }, restore: { kind: 'click', selector: '#setfx' }, restoreExpected: true },
  { id: 'screen-shake', field: 'shakeOn', durableField: 'shake', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '#setshake' }, restore: { kind: 'click', selector: '#setshake' }, restoreExpected: false },
  { id: 'motion', field: 'motionMode', durableField: 'rm', persistenceMode: 'immediate',
    mutate: { kind: 'click', selector: '[data-motion="0"]' },
    restore: { kind: 'click', selector: '[data-motion="-1"]' }, restoreExpected: -1 },
  { id: 'panel-tint', field: 'glassTint', durableField: 'gt', persistenceMode: 'debounce',
    mutate: { kind: 'input', selector: '#setglass', value: 94 },
    restore: { kind: 'input', selector: '#setglass', value: 55 }, restoreExpected: 0.82 },
] as const;
const writableSettingsManifest = (definitions = WRITABLE_SETTINGS_CASES) => definitions.map((definition) => {
  const original = WRITABLE_SETTINGS_ORIGINALS[definition.id];
  return {
    id: definition.id,
    field: definition.field,
    durableField: definition.durableField,
    persistenceMode: definition.persistenceMode,
    mutate: definition.mutate(original),
    restore: definition.restore(original),
    restoreExpected: definition.restoreExpected ? definition.restoreExpected(original) : original,
  };
});
const WRITABLE_EVIDENCE_MARKERS = [
  'targetFound !== true || restoreFound !== true',
  'JSON.stringify(restoreExpected) === JSON.stringify(mutated)',
  'JSON.stringify(restoreExpected) !== JSON.stringify(restored)',
  'assessWritableSettingPersistenceReceipt(mutateReceipt).ok !== true',
  'assessWritableSettingPersistenceReceipt(restoreReceipt).ok !== true',
  "reasons.push('writable settings receipt chain')",
  "reasons.push('collateral durable mutation')",
  "reasons.push('quiet durable authority')",
  "id === 'panel-tint'\n    ? initial !== 0.55 || restoreExpected !== 0.82",
  'restoreExpected: (before) => Math.min(0.98, Math.max(0.82, before))',
  "exactSettingsRecord(writableWrongRestore, 'panel-tint', 'panel-tint restore control')",
  'writableWrongRestoreTint.restored = writableWrongRestoreTint.before',
  "exactSettingsRecord(writableWrongLegacyTint, 'panel-tint', 'panel-tint legacy domain control')",
  'writableWrongLegacyTintRecord.before = writableWrongLegacyTintRecord.restoreExpected',
  "exactSettingsRecord(writableWrongTintDomain, 'panel-tint', 'panel-tint target domain control')",
  'writableWrongTintDomainRecord.restoreExpected = writableWrongTintDomainRecord.before',
  'writableWrongTintDomainRecord.restored = writableWrongTintDomainRecord.before',
  'const writableWrongTintDomainControl = assessReadOnlyBoundary(',
  "{ id: 'panel-tint target domain', control: writableWrongTintDomainControl, reason: 'writable settings control domains' }",
  'JSON.stringify(control.reasons) !== JSON.stringify([reason])',
  "exactSettingsRecord(writableMissingTarget, 'text-size', 'writable target control').targetFound = false",
  "exactSettingsRecord(writableMissingRestore, 'text-tone', 'writable restore-target control').restoreFound = false",
  "const label = `writable-settings/${definition.id}/${phase}`",
  "{ label: 'writable-settings/writers/quiesce' }",
  "{ label: 'writable-settings/writers/resume' }",
  "{ label: 'writable-settings/quiet' }",
  'const writablePersistenceControls = [',
  'const writableQuietControls = [',
  'const writableChainControls = [',
  'const writableStableExtraRow = structuredClone(writableReceipt);',
  'const writableRawDisjointChain = structuredClone(writableSettings);',
  'const writableRawDisjointQuiet = structuredClone(writableSettingsQuiet);',
  'const READ_WRITABLE_SETTINGS_DURABLE_EXPRESSION =',
  'return {revision:Number(revisionRaw),row};',
  'durableData: durableBefore?.row?.data ?? null',
  'durableRow: durableBefore?.row ?? null',
  'durableData: durable?.row?.data ?? null',
  'durableRow: durable?.row ?? null',
  'durableData: quietDurable?.row?.data ?? null',
  'durableRow: quietDurable?.row ?? null',
  'writableSettingsQuiescence?.answerableWas !== true',
  'observation?.answerable === false',
  '__smokeQuiesceSettingsPersistence()',
  '__smokeResumeSettingsPersistence()',
] as const;
const FULL_SLICE_WRITABLE_EVIDENCE_MARKERS = new Set<string>([
  'const READ_WRITABLE_SETTINGS_DURABLE_EXPRESSION =',
  'return {revision:Number(revisionRaw),row};',
]);
const VISUAL_SETTING_EVIDENCE_MARKERS = [
  "['visual-effects', 'click:setfx']",
  "['screen-shake', 'click:setshake']",
  "{ id: 'visual-effects', field: 'fxOn',",
  "{ id: 'screen-shake', field: 'shakeOn',",
  "{id:'visual-effects',field:'fxOn',act:()=>click('#setfx')}",
  "{id:'screen-shake',field:'shakeOn',act:()=>click('#setshake')}",
] as const;

function contractErrors(main: string, slice: string, contract = contractSource): string[] {
  const errors: string[] = [];
  const selector = section(main, 'const READ_ONLY_MUTATION_SELECTOR = [', "\n].join(',');");
  for (const marker of [
    "'#setsnd'", "'#setvol'", "'#setvoice'", "'[data-pref]'", "'[data-motion]'",
    "'#setcharts'", "'#setfx'", "'#setshake'", "'#setglass'", "'[data-arc5-feed-confirm]'",
  ]) if (!selector.includes(marker)) errors.push(`selector:${marker}`);
  if (selector.includes("'#setimport'")) errors.push('protected-import-blocked');
  if (selector.includes("'[data-inventory-action]'")) errors.push('inventory-action-capture-swallowed');
  if (!main.includes("el.querySelector('#setimport')!.addEventListener('click', openImportSheet);")) {
    errors.push('protected-import-unavailable');
  }
  for (const hook of [
    '__smokeSettingsPersistenceDiagnostics: settingsPersistenceSmokeDiagnostics',
    '__smokeQuiesceSettingsPersistence: smokeQuiesceSettingsPersistence',
    '__smokeResumeSettingsPersistence: smokeResumeSettingsPersistence',
  ]) if (!main.includes(hook)) errors.push(`settings-persistence-hook:${hook}`);
  const quiescenceOwner = section(
    main,
    'async function smokeQuiesceSettingsPersistence()',
    '\nfunction smokeResumeSettingsPersistence()',
  );
  if (!includesOrdered(quiescenceOwner, [
    'settingsPersistenceSmokeAnswerableWas = f4Runtime?.diagnostics().answerable === true;',
    'if (settingsPersistenceSmokeTickerWasRunning) app.stop();',
    'f4Runtime?.setAnswerable(false);',
    'const heartbeat = await quiesceF4HeartbeatForSmoke();',
    'f4Runtime?.setAnswerable(false);',
    'await waitForActivePersist();',
  ]) || !quiescenceOwner.includes('smokeResumeSettingsPersistence();')) {
    errors.push('settings-answerability-quiescence');
  }
  const resumeOwner = section(
    main,
    'function smokeResumeSettingsPersistence()',
    '\nconst productActionCoordinator',
  );
  if (!includesOrdered(resumeOwner, [
    'const restoreAnswerable = settingsPersistenceSmokeAnswerableWas;',
    'if (restartTicker && app.ticker && !app.ticker.started) app.start();',
    'const heartbeat = resumeF4HeartbeatForSmoke();',
    'const answerable = restoreAnswerable && f4RuntimeMayAnswer(runtime)',
    'runtime?.setAnswerable(answerable);',
    'tameGreetingAudioOwner?.setAnswerable(answerable);',
  ])) errors.push('settings-answerability-resume');

  const assessment = section(
    slice,
    'const SETTINGS_MUTATION_CASES = Object.freeze([',
    '\nconst assessFreshInitializationRace',
  );
  const owner = section(
    slice,
    '  /* Every save-mutating Settings control must work while the exact authority',
    '  /* Real same-tab ordering outcome.',
  );
  for (const id of CASE_IDS) {
    const assessmentCount = assessment.split(`['${id}',`).length - 1;
    const writableCount = contract.split(`{ id: '${id}', field:`).length - 1;
    const readOnlyCount = owner.split(`{id:'${id}',field:`).length - 1;
    if (assessmentCount !== 1 || writableCount !== 1 || readOnlyCount !== 1) {
      errors.push(`case:${id}:${assessmentCount}+${writableCount}+${readOnlyCount}`);
    }
  }
  if (!assessment.includes('writable settings outcomes')
    || !assessment.includes('all settings mutations blocked')
    || !owner.includes('runWritableSettingPhase')
    || owner.includes('await api.__smokePersistNow()')
    || !owner.includes('window.__CF_SLICE__.api.__smokeForceReadOnly(true)')
    || !owner.includes("exactSettingsRecord(readOnlyChanged, 'creature-voices', 'read-only mutation control').after = '__voice-mutated-read-only__'")) {
    errors.push('polarity-and-controls');
  }
  for (const marker of WRITABLE_EVIDENCE_MARKERS) {
    const present = FULL_SLICE_WRITABLE_EVIDENCE_MARKERS.has(marker)
      ? slice.includes(marker)
      : assessment.includes(marker) || owner.includes(marker) || contract.includes(marker);
    if (!present) {
      errors.push(`writable-evidence:${marker}`);
    }
  }
  for (const marker of VISUAL_SETTING_EVIDENCE_MARKERS) {
    if (!assessment.includes(marker) && !owner.includes(marker) && !contract.includes(marker)) {
      errors.push(`visual-setting-evidence:${marker}`);
    }
  }
  if (/\b(?:writable|readOnly)[A-Za-z]*\[\d+\]/.test(owner)) {
    errors.push('hard-coded-settings-control-index');
  }
  return errors;
}

describe('ordinary Settings mutations share the read-only boundary', () => {
  it('covers all eleven writable/read-only outcomes while retaining protected import', () => {
    expect(contractErrors(mainSource, sliceSource)).toEqual([]);
    const manifest = writableSettingsManifest();
    expect(manifest).toEqual(EXPECTED_WRITABLE_SETTINGS_MANIFEST);
    const visualEffects = manifest.find((entry) => entry.id === 'visual-effects')!;
    const duplicatedSound = manifest.map((entry) => entry.id === 'sound' ? {
      ...entry,
      field: visualEffects.field,
      durableField: visualEffects.durableField,
      mutate: visualEffects.mutate,
      restore: visualEffects.restore,
    } : entry);
    expect(duplicatedSound).not.toEqual(EXPECTED_WRITABLE_SETTINGS_MANIFEST);
  });

  it('rejects a missing voice selector or any missing table member', () => {
    const withoutVoice = mainSource.replace("'#setvol', '#setvoice',", "'#setvol',");
    expect(contractErrors(withoutVoice, sliceSource)).toContain("selector:'#setvoice'");

    const withoutFeed = mainSource.replace("  '[data-arc5-feed-confirm]',\n", '');
    expect(contractErrors(withoutFeed, sliceSource))
      .toContain("selector:'[data-arc5-feed-confirm]'");

    const blockedImport = mainSource.replace(
      "'#dockcharts', '#setsnd',",
      "'#setimport', '#dockcharts', '#setsnd',",
    );
    expect(contractErrors(blockedImport, sliceSource)).toContain('protected-import-blocked');

    const swallowedInventoryAction = mainSource.replace(
      "'#dockcharts', '#setsnd',",
      "'[data-inventory-action]', '#dockcharts', '#setsnd',",
    );
    expect(contractErrors(swallowedInventoryAction, sliceSource))
      .toContain('inventory-action-capture-swallowed');

    const missingImport = mainSource.replace(
      "el.querySelector('#setimport')!.addEventListener('click', openImportSheet);",
      "/* negative control: protected import unavailable */",
    );
    expect(contractErrors(missingImport, sliceSource)).toContain('protected-import-unavailable');

    const missingPostHeartbeatAnswerability = mainSource.replace(
      '    f4Runtime?.setAnswerable(false);\n    tameGreetingAudioOwner?.setAnswerable(false);',
      '    /* negative control: joined heartbeat answerability not reasserted */',
    );
    expect(contractErrors(missingPostHeartbeatAnswerability, sliceSource))
      .toContain('settings-answerability-quiescence');
    const missingResumeAnswerability = mainSource.replace(
      '  runtime?.setAnswerable(answerable);',
      '  /* negative control: answerability not restored */',
    );
    expect(contractErrors(missingResumeAnswerability, sliceSource))
      .toContain('settings-answerability-resume');

    for (const [index, id] of CASE_IDS.entries()) {
      const writableMarker = `{ id: '${id}', field:`;
      const readOnlyMarker = `{id:'${id}',field:`;
      expect(contractSource.split(writableMarker).length - 1, `${id}/writable`).toBe(1);
      expect(sliceSource.split(readOnlyMarker).length - 1, `${id}/read-only`).toBe(1);
      const writableMutant = contractSource.replace(
        writableMarker, `{ id: '__SETTINGS_WRITABLE_MUTANT_${index}__', field:`,
      );
      expect(contractErrors(mainSource, sliceSource, writableMutant)
        .some((error) => error.startsWith(`case:${id}:`)), `${id}/writable`).toBe(true);
      const readOnlyMutant = sliceSource.replace(
        readOnlyMarker, `{id:'__SETTINGS_READ_ONLY_MUTANT_${index}__',field:`,
      );
      expect(contractErrors(mainSource, readOnlyMutant)
        .some((error) => error.startsWith(`case:${id}:`)), `${id}/read-only`).toBe(true);
    }

    for (const marker of WRITABLE_EVIDENCE_MARKERS) {
      const replacement = `__WRITABLE_EVIDENCE_MUTANT_${marker.length}__`;
      if (sliceSource.includes(marker)) {
        expect(contractErrors(mainSource, sliceSource.replace(marker, replacement)))
          .toContain(`writable-evidence:${marker}`);
      } else {
        expect(contractErrors(mainSource, sliceSource, contractSource.replace(marker, replacement)))
          .toContain(`writable-evidence:${marker}`);
      }
    }

    for (const marker of VISUAL_SETTING_EVIDENCE_MARKERS) {
      const replacement = `__VISUAL_SETTING_MUTANT_${marker.length}__`;
      if (sliceSource.includes(marker)) {
        expect(contractErrors(mainSource, sliceSource.replace(marker, replacement)))
          .toContain(`visual-setting-evidence:${marker}`);
      } else {
        expect(contractErrors(mainSource, sliceSource, contractSource.replace(marker, replacement)))
          .toContain(`visual-setting-evidence:${marker}`);
      }
    }

    const hardCodedIndex = sliceSource.replace(
      "exactSettingsRecord(writableWrongRestore, 'panel-tint', 'panel-tint restore control')",
      'writableWrongRestore[10]',
    );
    expect(contractErrors(mainSource, hardCodedIndex)).toContain('hard-coded-settings-control-index');
  });

  it('accepts exactly one handler-owned commit and rejects every incomplete or extra receipt', () => {
    const exclusive = {
      schema: 'cf-v2-settings-persistence-diagnostics/v1',
      documentToken: 'document-a', settingsProbeQuiesced: true,
      tickerRunning: false, heartbeatRunning: false, ecologyCheckpointInFlight: false,
      pendingPersistenceWrites: 0, pendingDebounceWrites: 0,
      answerable: false, mutationBlocked: false, leaseOwned: true,
    } as const;
    const beforeDurableRow = {
      schema: 5, segment: 'settings', data: { snd: 1, vol: 37, fx: 1 },
      extensions: { witness: { version: 1, json: '{}' } },
    } as const;
    const afterDurableRow = {
      ...beforeDurableRow, data: { ...beforeDurableRow.data, snd: 0 },
    } as const;
    const receipt = {
      id: 'sound', field: 'sndOn', durableField: 'snd', phase: 'mutate',
      persistenceMode: 'immediate', targetFound: true,
      expectedValue: false, expectedBeforeDurableValue: 1, expectedDurableValue: 0,
      before: {
        ...exclusive, revision: 41, commits: 7, lastOutcome: 'committed:41', value: true,
        durableRevision: 41, durableSchema: 5, durableSegment: 'settings', durableValue: 1,
        durableData: beforeDurableRow.data, durableRow: beforeDurableRow,
      },
      actionWitness: {
        ...exclusive, revision: 41, commits: 7, lastOutcome: 'committed:41',
        pendingPersistenceWrites: 1,
      },
      after: {
        ...exclusive, revision: 42, commits: 8, lastOutcome: 'committed:42', value: false,
        durableRevision: 42, durableSchema: 5, durableSegment: 'settings', durableValue: 0,
        durableData: afterDurableRow.data, durableRow: afterDurableRow,
      },
    } as const;
    expect(assessWritableSettingPersistenceReceipt(receipt)).toEqual({ ok: true, reasons: [] });
    const collateralMutation = { ...receipt, after: {
      ...receipt.after,
      durableData: { ...receipt.after.durableData, fx: 0 },
      durableRow: { ...receipt.after.durableRow,
        data: { ...receipt.after.durableRow.data, fx: 0 } },
    } };
    const mutants = [
      { ...receipt, targetFound: false },
      { ...receipt, before: { ...receipt.before, revision: -1 } },
      { ...receipt, before: { ...receipt.before, pendingDebounceWrites: 1 } },
      { ...receipt, actionWitness: {
        ...receipt.actionWitness, pendingPersistenceWrites: 0,
      } },
      { ...receipt, actionWitness: {
        ...receipt.actionWitness, ecologyCheckpointInFlight: true,
      } },
      { ...receipt, after: { ...receipt.after, documentToken: 'document-b' } },
      { ...receipt, after: { ...receipt.after, revision: 41 } },
      { ...receipt, after: { ...receipt.after, revision: 43 } },
      { ...receipt, after: { ...receipt.after, commits: 7 } },
      { ...receipt, after: { ...receipt.after, pendingPersistenceWrites: 1 } },
      { ...receipt, after: { ...receipt.after, lastOutcome: 'committed:wrong' } },
      { ...receipt, after: { ...receipt.after, value: true } },
      { ...receipt, after: { ...receipt.after, durableRevision: 41 } },
      { ...receipt, after: { ...receipt.after, durableValue: 1 } },
      collateralMutation,
      { ...receipt, after: {
        ...receipt.after,
        durableRow: { ...receipt.after.durableRow,
          extensions: { ...receipt.after.durableRow.extensions,
            mutant: { version: 1, json: '{}' } } },
      } },
      { ...receipt, after: {
        ...receipt.after, durableRow: { ...receipt.after.durableRow, unexpectedTopLevel: true },
      } },
    ];
    expect(mutants.map((mutant) => assessWritableSettingPersistenceReceipt(mutant).ok))
      .toEqual(mutants.map(() => false));
    expect(assessWritableSettingPersistenceReceipt(collateralMutation))
      .toEqual({ ok: false, reasons: ['collateral durable mutation'] });
    const stableExtraRow = {
      ...receipt,
      before: { ...receipt.before,
        durableRow: { ...receipt.before.durableRow, unexpectedTopLevel: true } },
      after: { ...receipt.after,
        durableRow: { ...receipt.after.durableRow, unexpectedTopLevel: true } },
    };
    expect(assessWritableSettingPersistenceReceipt(stableExtraRow).ok).toBe(false);

    const quiet = { before: receipt.after, after: { ...receipt.after } };
    expect(assessWritableSettingsQuietWindow(quiet)).toEqual({ ok: true, reasons: [] });
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: { ...quiet.after, revision: quiet.after.revision + 1 },
    }).ok).toBe(false);
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: { ...quiet.after, pendingPersistenceWrites: 1 },
    }).ok).toBe(false);
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: { ...quiet.after, documentToken: 'document-b' },
    }).ok).toBe(false);
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: { ...quiet.after, commits: quiet.after.commits + 1 },
    }).ok).toBe(false);
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: { ...quiet.after, lastOutcome: 'committed:wrong' },
    }).ok).toBe(false);
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: {
        ...quiet.after,
        durableData: { ...quiet.after.durableData, vol: 38 },
        durableRow: { ...quiet.after.durableRow,
          data: { ...quiet.after.durableRow.data, vol: 38 } },
      },
    }).ok).toBe(false);
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: {
        ...quiet.after,
        durableRow: { ...quiet.after.durableRow,
          extensions: { ...quiet.after.durableRow.extensions,
            mutant: { version: 1, json: '{}' } } },
      },
    }).ok).toBe(false);
    expect(assessWritableSettingsQuietWindow({
      ...quiet, after: {
        ...quiet.after, durableRow: { ...quiet.after.durableRow, unexpectedTopLevel: true },
      },
    }).ok).toBe(false);

    const restoreReceipt = {
      ...receipt,
      phase: 'restore' as const,
      expectedValue: true,
      expectedBeforeDurableValue: 0,
      expectedDurableValue: 1,
      before: { ...receipt.after },
      actionWitness: {
        ...receipt.after, pendingPersistenceWrites: 1,
      },
      after: {
        ...receipt.after, revision: 43, commits: 9, lastOutcome: 'committed:43', value: true,
        durableRevision: 43, durableValue: 1,
        durableData: { ...receipt.after.durableData, snd: 1 },
        durableRow: { ...receipt.after.durableRow,
          data: { ...receipt.after.durableRow.data, snd: 1 } },
      },
    };
    const records = [{ mutateReceipt: receipt, restoreReceipt }];
    const chainQuiet = { before: restoreReceipt.after, after: { ...restoreReceipt.after } };
    expect(assessWritableSettingsPersistenceChain(records, chainQuiet))
      .toEqual({ ok: true, reasons: [] });
    const disjointRestore = {
      ...restoreReceipt,
      before: { ...restoreReceipt.before,
        revision: 52, commits: 18, lastOutcome: 'committed:52', durableRevision: 52 },
      actionWitness: { ...restoreReceipt.actionWitness,
        revision: 52, commits: 18, lastOutcome: 'committed:52' },
      after: { ...restoreReceipt.after,
        revision: 53, commits: 19, lastOutcome: 'committed:53', durableRevision: 53 },
    };
    const disjointQuiet = { before: disjointRestore.after, after: { ...disjointRestore.after } };
    expect(assessWritableSettingPersistenceReceipt(disjointRestore).ok).toBe(true);
    expect(assessWritableSettingsPersistenceChain([{
      ...records[0], restoreReceipt: disjointRestore,
    }], disjointQuiet).ok).toBe(false);
    const rawDisjointRestore = {
      ...restoreReceipt,
      before: { ...restoreReceipt.before,
        durableData: { ...restoreReceipt.before.durableData, vol: 88 },
        durableRow: { ...restoreReceipt.before.durableRow,
          data: { ...restoreReceipt.before.durableRow.data, vol: 88 } } },
      after: { ...restoreReceipt.after,
        durableData: { ...restoreReceipt.after.durableData, vol: 88 },
        durableRow: { ...restoreReceipt.after.durableRow,
          data: { ...restoreReceipt.after.durableRow.data, vol: 88 } } },
    };
    expect(assessWritableSettingPersistenceReceipt(rawDisjointRestore).ok).toBe(true);
    expect(assessWritableSettingsPersistenceChain([{
      ...records[0], restoreReceipt: rawDisjointRestore,
    }], { before: rawDisjointRestore.after, after: { ...rawDisjointRestore.after } }).ok).toBe(false);
    expect(assessWritableSettingsPersistenceChain(records, {
      ...chainQuiet, before: { ...chainQuiet.before, commits: 99 },
    }).ok).toBe(false);
    const rawDisjointQuiet = {
      before: { ...chainQuiet.before,
        durableRow: { ...chainQuiet.before.durableRow,
          extensions: { ...chainQuiet.before.durableRow.extensions,
            quietMutant: { version: 1, json: '{}' } } } },
      after: { ...chainQuiet.after,
        durableRow: { ...chainQuiet.after.durableRow,
          extensions: { ...chainQuiet.after.durableRow.extensions,
            quietMutant: { version: 1, json: '{}' } } } },
    };
    expect(assessWritableSettingsQuietWindow(rawDisjointQuiet).ok).toBe(true);
    expect(assessWritableSettingsPersistenceChain(records, rawDisjointQuiet).ok).toBe(false);
  });

  it('compiles and executes all generated mutate/restore page expressions', () => {
    const project = (field: string, operation: ReturnType<(typeof WRITABLE_SETTINGS_CASES)[number]['mutate']>, current: unknown) => {
      if (operation.kind === 'input') {
        const percent = Number(operation.value);
        return field === 'glassTint' ? Math.max(82, Math.min(98, percent)) / 100 : percent / 100;
      }
      if (operation.selector.startsWith('#')) return !current;
      const pref = /data-value="([^"]*)"/u.exec(operation.selector);
      if (pref) return pref[1];
      const motion = /data-motion="(-?\d+)"/u.exec(operation.selector);
      return motion ? Number(motion[1]) : current;
    };

    for (const definition of WRITABLE_SETTINGS_CASES) {
      const original = WRITABLE_SETTINGS_ORIGINALS[definition.id];
      const expectedDefinition = EXPECTED_WRITABLE_SETTINGS_MANIFEST.find(
        (candidate) => candidate.id === definition.id,
      )!;
      const mutated = project(definition.field, definition.mutate(original), original);
      for (const phase of ['mutate', 'restore'] as const) {
        const operation = definition[phase](original);
        const expectedOperation = expectedDefinition[phase];
        const state: Record<string, unknown> = {
          [definition.field]: phase === 'mutate' ? original : mutated,
        };
        const diagnostics: Record<string, unknown> = {
          schema: 'cf-v2-settings-persistence-diagnostics/v1', documentToken: 'document-a',
          settingsProbeQuiesced: true, tickerRunning: false, heartbeatRunning: false,
          ecologyCheckpointInFlight: false, pendingPersistenceWrites: 0,
          pendingDebounceWrites: 0, answerable: false, mutationBlocked: false, leaseOwned: true,
          revision: 10, commits: 2, lastOutcome: 'committed:10',
        };
        const arm = () => {
          if (definition.persistenceMode === 'immediate') diagnostics.pendingPersistenceWrites = 1;
          else diagnostics.pendingDebounceWrites = 1;
        };
        const target = {
          value: '',
          click: () => { state[definition.field] = project(definition.field, operation, state[definition.field]); arm(); },
          dispatchEvent: () => {
            const percent = Number(target.value);
            state[definition.field] = definition.field === 'glassTint'
              ? Math.max(82, Math.min(98, percent)) / 100 : percent / 100;
            arm();
            return true;
          },
        };
        let selector = '';
        const document = { querySelector: (value: string) => {
          selector = value;
          return value === expectedOperation.selector ? target : null;
        } };
        const api = {
          state: () => state,
          __smokeSettingsPersistenceDiagnostics: () => ({ ...diagnostics }),
        };
        const window = { __CF_SLICE__: { api } };
        class FakeEvent { constructor(..._args: unknown[]) {} }
        const expression = buildWritableSettingActionExpression(definition, phase, original);
        const run = new Function('window', 'document', 'Event', `return ${expression};`);
        const result = run(window, document, FakeEvent);
        expect(selector, `${definition.id}/${phase}/selector`).toBe(expectedOperation.selector);
        expect(result.targetFound, `${definition.id}/${phase}/target`).toBe(true);
        expect(result.expectedValue, `${definition.id}/${phase}/value`)
          .toEqual(project(
            definition.field, expectedOperation, phase === 'mutate' ? original : mutated,
          ));
        expect(result.actionWitness.pendingPersistenceWrites, `${definition.id}/${phase}/immediate`)
          .toBe(definition.persistenceMode === 'immediate' ? 1 : 0);
        expect(result.actionWitness.pendingDebounceWrites, `${definition.id}/${phase}/debounce`)
          .toBe(definition.persistenceMode === 'debounce' ? 1 : 0);

        const snapshotExpression = buildWritableSettingSnapshotExpression(definition.field);
        const snapshot = new Function('window', `return ${snapshotExpression};`)(window);
        expect(snapshot.value, `${definition.id}/${phase}/snapshot`).toEqual(result.expectedValue);
      }
    }
  });
});
