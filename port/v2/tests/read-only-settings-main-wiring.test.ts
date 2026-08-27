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
  'font', 'star-charts', 'motion', 'panel-tint',
] as const;

function contractErrors(main: string, slice: string): string[] {
  const errors: string[] = [];
  const selector = section(main, 'const READ_ONLY_MUTATION_SELECTOR = [', "\n].join(',');");
  for (const marker of [
    "'#setsnd'", "'#setvol'", "'#setvoice'", "'[data-pref]'", "'[data-motion]'",
    "'#setcharts'", "'#setglass'",
  ]) if (!selector.includes(marker)) errors.push(`selector:${marker}`);
  if (selector.includes("'#setimport'")) errors.push('protected-import-blocked');
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
    || !owner.includes("readOnlyChanged[2].after = '__voice-mutated-read-only__'")) {
    errors.push('polarity-and-controls');
  }
  return errors;
}

describe('ordinary Settings mutations share the read-only boundary', () => {
  it('covers all nine writable/read-only outcomes while retaining protected import', () => {
    expect(contractErrors(mainSource, sliceSource)).toEqual([]);
  });

  it('rejects a missing voice selector or any missing table member', () => {
    const withoutVoice = mainSource.replace("'#setvol', '#setvoice',", "'#setvol',");
    expect(contractErrors(withoutVoice, sliceSource)).toContain("selector:'#setvoice'");

    const blockedImport = mainSource.replace(
      "'#dockcharts', '#setsnd',",
      "'#setimport', '#dockcharts', '#setsnd',",
    );
    expect(contractErrors(blockedImport, sliceSource)).toContain('protected-import-blocked');

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
  });
});
