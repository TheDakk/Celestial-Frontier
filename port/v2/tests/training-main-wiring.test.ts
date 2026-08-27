import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainPath = new URL('../apps/game/src/main.ts', import.meta.url);
const mainSource = readFileSync(mainPath, 'utf8');
const trainingSource = readFileSync(
  new URL('../apps/game/src/training.ts', import.meta.url),
  'utf8',
);
const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  return at < 0 || stop < 0 ? '' : source.slice(at, stop);
}

function replaceUnique(source: string, target: string, replacement: string): string {
  expect(source.split(target).length - 1, target).toBe(1);
  const next = source.replace(target, replacement);
  expect(next).not.toBe(source);
  return next;
}

function wiringErrors(source: string): string[] {
  const errors: string[] = [];
  const imports = section(source, 'import {\n  initTraining', "} from './training.js';");
  const showSurvey = section(source, 'function showSurvey(', '\nfunction hideSurvey(');
  if (!imports.includes('refreshTrainingScope')) errors.push('training-refresh-import');
  if (showSurvey.length === 0) return [...errors, 'show-survey-section'];
  const visible = showSurvey.indexOf("card.setAttribute('aria-hidden', 'false');");
  const refresh = showSurvey.indexOf('refreshTrainingScope();');
  if (visible < 0 || refresh <= visible
    || (showSurvey.match(/refreshTrainingScope\(\);/gu) ?? []).length !== 1) {
    errors.push('training-refresh-order');
  }
  return errors;
}

describe('Field Training Survey replacement wiring', () => {
  it('rebinds the live lesson only after the replacement Survey is visible', () => {
    expect(wiringErrors(mainSource)).toEqual([]);
  });

  it('rejects missing, unimported, and pre-publication refresh wiring', () => {
    const missingCall = replaceUnique(mainSource, '  refreshTrainingScope();\n', '');
    expect(wiringErrors(missingCall)).toEqual(['training-refresh-order']);

    const missingImport = replaceUnique(mainSource, ', refreshTrainingScope,', ',');
    expect(wiringErrors(missingImport)).toEqual(['training-refresh-import']);

    const showSurvey = section(mainSource, 'function showSurvey(', '\nfunction hideSurvey(');
    const withoutLateCall = replaceUnique(showSurvey, '  refreshTrainingScope();\n', '');
    const earlyShowSurvey = replaceUnique(
      withoutLateCall,
      "  card.style.display = 'block';",
      "  refreshTrainingScope();\n  card.style.display = 'block';",
    );
    expect(earlyShowSurvey).toContain("refreshTrainingScope();\n  card.style.display = 'block';");
    const earlyCall = replaceUnique(mainSource, showSurvey, earlyShowSurvey);
    expect(wiringErrors(earlyCall)).toEqual(['training-refresh-order']);
  });

  it('keeps only the wrong-world Close keyboard target live during find-earth', () => {
    expect(trainingSource).toContain(
      "id: 'find-earth', allow: ['#cosmos', '#survey [data-survey-close]']",
    );
    const keyboard = section(
      mainSource,
      'function installKeyboardExploration(): void {',
      '\n/* ---- the save/reload leg',
    );
    expect(keyboard).toContain(
      ".find((target) => target !== null && !target.closest('[inert]'))?.focus();",
    );

    const missingCloseAllowance = replaceUnique(
      trainingSource,
      ", '#survey [data-survey-close]'",
      '',
    );
    expect(missingCloseAllowance).not.toContain(
      "id: 'find-earth', allow: ['#cosmos', '#survey [data-survey-close]']",
    );
    const optimisticKeyboard = replaceUnique(
      keyboard,
      " && !target.closest('[inert]')",
      '',
    );
    expect(optimisticKeyboard).not.toContain(
      ".find((target) => target !== null && !target.closest('[inert]'))?.focus();",
    );
  });

  it('keeps real pointer and keyboard wrong-world outcomes in the authoritative Slice gate', () => {
    const owner = section(
      sliceSource,
      '  /* A wrong-world detour used to become a modal Training trap:',
      '  await evalT(`(()=>{ return window.__CF_SLICE__.api.surveyOn',
    );
    const required = [
      'await pointerT(mercuryPoint.screenX, mercuryPoint.screenY);',
      "fails.push('DRILL WRONG WORLD POINTER: Mercury did not open with only real Close available:",
      "close.setAttribute('inert','');close.style.pointerEvents='none'",
      'await pointerT(wrongClosePoint.x, wrongClosePoint.y);',
      "await keyT('ArrowRight', 'ArrowRight');",
      "await keyT('Enter', 'Enter');",
      "await keyT('Escape', 'Escape');",
      'wrongKeyboardClosed.escapeLeak !== 0',
      "window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'",
      '&&JSON.stringify(s.save.landed)===',
      's.atlasCount===',
    ] as const;
    for (const marker of required) expect(owner, marker).toContain(marker);

    for (const [index, marker] of required.entries()) {
      expect(owner.split(marker).length - 1, marker).toBe(1);
      const mutant = owner.replace(marker, `__WRONG_WORLD_MUTANT_${index}__`);
      expect(mutant, marker).not.toContain(marker);
    }
  });
});
