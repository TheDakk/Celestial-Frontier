import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const sliceSource = readFileSync(new URL('../tools/slicesmoke.mjs', import.meta.url), 'utf8');

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  return at < 0 || stop < 0 ? '' : source.slice(at, stop);
}

const CASE_IDS = [
  'sound', 'volume', 'creature-voices', 'text-size', 'text-tone',
  'font', 'star-charts', 'visual-effects', 'screen-shake', 'motion', 'panel-tint',
] as const;
const WRITABLE_EVIDENCE_MARKERS = [
  'targetFound !== true || restoreFound !== true',
  'JSON.stringify(restoreExpected) === JSON.stringify(mutated)',
  'JSON.stringify(restoreExpected) !== JSON.stringify(restored)',
  "id === 'panel-tint'\n    ? initial !== 0.55 || restoreExpected !== 0.82",
  'restoreExpected:(before)=>Math.min(0.98,Math.max(0.82,before))',
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
] as const;
const VISUAL_SETTING_EVIDENCE_MARKERS = [
  "['visual-effects', 'click:setfx']",
  "['screen-shake', 'click:setshake']",
  "{id:'visual-effects',field:'fxOn',mutate:()=>click('#setfx'),restore:()=>click('#setfx')}",
  "{id:'screen-shake',field:'shakeOn',mutate:()=>click('#setshake'),restore:()=>click('#setshake')}",
  "{id:'visual-effects',field:'fxOn',act:()=>click('#setfx')}",
  "{id:'screen-shake',field:'shakeOn',act:()=>click('#setshake')}",
] as const;

function contractErrors(main: string, slice: string): string[] {
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
    const ownerCount = owner.split(`id:'${id}'`).length - 1;
    if (assessmentCount !== 1 || ownerCount !== 2) {
      errors.push(`case:${id}:${assessmentCount}+${ownerCount}`);
    }
  }
  if (!assessment.includes('writable settings outcomes')
    || !assessment.includes('all settings mutations blocked')
    || !owner.includes('await api.__smokePersistNow()')
    || !owner.includes('window.__CF_SLICE__.api.__smokeForceReadOnly(true)')
    || !owner.includes("exactSettingsRecord(readOnlyChanged, 'creature-voices', 'read-only mutation control').after = '__voice-mutated-read-only__'")) {
    errors.push('polarity-and-controls');
  }
  for (const marker of WRITABLE_EVIDENCE_MARKERS) {
    if (!assessment.includes(marker) && !owner.includes(marker)) errors.push(`writable-evidence:${marker}`);
  }
  for (const marker of VISUAL_SETTING_EVIDENCE_MARKERS) {
    if (!assessment.includes(marker) && !owner.includes(marker)) errors.push(`visual-setting-evidence:${marker}`);
  }
  if (/\b(?:writable|readOnly)[A-Za-z]*\[\d+\]/.test(owner)) {
    errors.push('hard-coded-settings-control-index');
  }
  return errors;
}

describe('ordinary Settings mutations share the read-only boundary', () => {
  it('covers all eleven writable/read-only outcomes while retaining protected import', () => {
    expect(contractErrors(mainSource, sliceSource)).toEqual([]);
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

    for (const [index, id] of CASE_IDS.entries()) {
      const marker = `id:'${id}'`;
      expect(sliceSource.split(marker).length - 1, id).toBe(2);
      const mutant = sliceSource.replace(marker, `id:'__SETTINGS_MUTANT_${index}__'`);
      expect(contractErrors(mainSource, mutant).some((error) => error.startsWith(`case:${id}:`)), id).toBe(true);
    }

    for (const marker of WRITABLE_EVIDENCE_MARKERS) {
      const mutant = sliceSource.replace(marker, `__WRITABLE_EVIDENCE_MUTANT_${marker.length}__`);
      expect(contractErrors(mainSource, mutant)).toContain(`writable-evidence:${marker}`);
    }

    for (const marker of VISUAL_SETTING_EVIDENCE_MARKERS) {
      const mutant = sliceSource.replace(marker, `__VISUAL_SETTING_MUTANT_${marker.length}__`);
      expect(contractErrors(mainSource, mutant)).toContain(`visual-setting-evidence:${marker}`);
    }

    const hardCodedIndex = sliceSource.replace(
      "exactSettingsRecord(writableWrongRestore, 'panel-tint', 'panel-tint restore control')",
      'writableWrongRestore[10]',
    );
    expect(contractErrors(mainSource, hardCodedIndex)).toContain('hard-coded-settings-control-index');
  });
});
