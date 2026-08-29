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

function panelTourWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const codexRecords = section(
    source,
    "registerPanel({ id: 'codex'",
    '\nconst inventoryPanelController',
  );
  const engineering = section(
    source,
    'const engineeringPanelRegistration = engineeringPanelController.registration();',
    '\nfunction shipyardDiagnostics',
  );
  if (codexRecords.length === 0) errors.push('codex-records-section');
  if (engineering.length === 0) errors.push('engineering-section');
  if (errors.length) return errors;

  const expected = [
    {
      label: 'codex', source: codexRecords,
      populate: 'codexOpenController.onOpen();',
      event: "gameEvent('panel-open', { id: 'codex', open: true });",
    },
    {
      label: 'records', source: codexRecords,
      populate: 'fillRecords();',
      event: "gameEvent('panel-open', { id: 'rec', open: true });",
    },
    {
      label: 'engineering', source: engineering,
      populate: 'engineeringPanelRegistration.onOpen();',
      event: "gameEvent('panel-open', { id: 'shipyard', open: true });",
    },
  ] as const;
  for (const { label, source: owner, populate, event } of expected) {
    const populatedAt = owner.indexOf(populate);
    const eventAt = owner.indexOf(event);
    if (populatedAt < 0 || eventAt <= populatedAt
      || owner.split(event).length - 1 !== 1) {
      errors.push(`${label}-panel-open-order`);
    }
  }
  if ((source.match(/gameEvent\('panel-open', \{ id: '(?:codex|rec|shipyard)', open: true \}\);/gu) ?? []).length !== 3) {
    errors.push('panel-open-exact-count');
  }
  return errors;
}

function sliceTrainingTourErrors(source: string): string[] {
  const errors: string[] = [];
  const owner = section(
    source,
    '  /* 4e. THE TRAINING DRILL — the six hands-on navigation lessons plus the',
    '  /* Hold an older persist across the native Finish activation, then attempt',
  );
  if (owner.length === 0) return ['slice-training-section'];

  const receipts = [
    "await recordTrainingReceipt('welcome', 1);",
    "await recordTrainingReceipt('find-earth', 2);",
    "await recordTrainingReceipt('survey-tour', 3);",
    "await recordTrainingReceipt('atlas-add', 4);",
    "await recordTrainingReceipt('atlas-open', 5);",
    "await recordTrainingReceipt('land', 6);",
    "await recordTrainingReceipt('planetside-briefing', 7);",
    "await recordTrainingReceipt('engineering-open', 8);",
    "await recordTrainingReceipt('engineering-tour', 9, 'shipyard');",
    "await recordTrainingReceipt('compendium-open', 10);",
    "await recordTrainingReceipt('compendium-tour', 11, 'codex');",
    "await recordTrainingReceipt('records-open', 12);",
    "await recordTrainingReceipt('records-tour', 13, 'rec');",
    "await recordTrainingReceipt('horizon', 14);",
    "await recordTrainingReceipt('grad', 15);",
  ] as const;
  let prior = -1;
  for (const [index, receipt] of receipts.entries()) {
    const at = owner.indexOf(receipt);
    if (at <= prior || owner.split(receipt).length - 1 !== 1) {
      errors.push(`slice-training-receipt-${index + 1}`);
    }
    prior = at;
  }

  const required = [
    'receipt.primary !== dtrainFullBootRaw',
    'trainingSequenceReceipts.length !== exactTrainingSequence.length',
    'JSON.stringify(observedTrainingSequence) !== JSON.stringify(exactTrainingSequence)',
    "trainingBoardTourCheck('shipyardpanel', 'engineering-tour')",
    "trainingBoardTourCheck('codexpanel', 'compendium-tour')",
    "trainingBoardTourCheck('recpanel', 'records-tour')",
    "button.textContent='Injected engineering mutation';panel.append(button);",
    "button.textContent='Injected companion mutation';panel.append(button);",
    "button.textContent='Injected records mutation';panel.append(button);",
    "!engineeringHold.held || !engineeringHold.unavailable || engineeringHold.actions !== 0",
    'compendiumHeldRows.rows < 1 || !compendiumHeldRows.allLocked',
    "trainingSideCheck('planetside-briefing')",
    "trainingSideCheck('grad')",
    '/Field Training, step 15 of 15/i.test(gradFocus.announcement)',
  ] as const;
  for (const [index, marker] of required.entries()) {
    if (!owner.includes(marker)) errors.push(`slice-training-oracle-${index + 1}`);
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

describe('Field Training read-only board lifecycle wiring', () => {
  it('emits each exact panel-open event once and only after that board is populated', () => {
    expect(panelTourWiringErrors(mainSource)).toEqual([]);
  });

  it('rejects missing, forged, duplicate, and pre-population board events', () => {
    const codexEvent = "  gameEvent('panel-open', { id: 'codex', open: true });\n";
    expect(panelTourWiringErrors(replaceUnique(mainSource, codexEvent, '')))
      .toEqual(['codex-panel-open-order', 'panel-open-exact-count']);

    const forgedRecords = replaceUnique(
      mainSource,
      "gameEvent('panel-open', { id: 'rec', open: true });",
      "gameEvent('panel-open', { id: 'records', open: true });",
    );
    expect(panelTourWiringErrors(forgedRecords))
      .toEqual(['records-panel-open-order', 'panel-open-exact-count']);

    const engineeringOwner = section(
      mainSource,
      'const engineeringPanelRegistration = engineeringPanelController.registration();',
      '\nfunction shipyardDiagnostics',
    );
    const withoutEvent = replaceUnique(
      engineeringOwner,
      "    gameEvent('panel-open', { id: 'shipyard', open: true });\n",
      '',
    );
    const earlyEvent = replaceUnique(
      withoutEvent,
      '    refreshEngineeringPanelState();',
      "    gameEvent('panel-open', { id: 'shipyard', open: true });\n    refreshEngineeringPanelState();",
    );
    expect(panelTourWiringErrors(replaceUnique(mainSource, engineeringOwner, earlyEvent)))
      .toEqual(['engineering-panel-open-order']);

    const duplicate = replaceUnique(
      mainSource,
      codexEvent,
      codexEvent + codexEvent,
    );
    expect(panelTourWiringErrors(duplicate))
      .toEqual(['codex-panel-open-order', 'panel-open-exact-count']);
  });
});

describe('Field Training authoritative Slice journey', () => {
  it('requires every exact card and each populated read-only board without rewriting the held primary', () => {
    expect(sliceTrainingTourErrors(sliceSource)).toEqual([]);
  });

  it('rejects skipped cards, forged board receipts, missing storage proof, and vacuous board locks', () => {
    const missingOrientation = replaceUnique(
      sliceSource,
      "  await recordTrainingReceipt('records-tour', 13, 'rec');\n",
      '',
    );
    expect(sliceTrainingTourErrors(missingOrientation))
      .toContain('slice-training-receipt-13');

    const forgedPanel = replaceUnique(
      sliceSource,
      "await recordTrainingReceipt('engineering-tour', 9, 'shipyard');",
      "await recordTrainingReceipt('engineering-tour', 9, 'codex');",
    );
    expect(sliceTrainingTourErrors(forgedPanel))
      .toContain('slice-training-receipt-9');

    const noPrimaryProof = replaceUnique(
      sliceSource,
      '      || receipt.heading !== expectedHeading || !announced || receipt.primary !== dtrainFullBootRaw) {',
      '      || receipt.heading !== expectedHeading || !announced) {',
    );
    expect(sliceTrainingTourErrors(noPrimaryProof))
      .toContain('slice-training-oracle-1');

    const vacuousEngineering = replaceUnique(
      sliceSource,
      "    button.type='button';button.textContent='Injected engineering mutation';panel.append(button);\n",
      "    button.type='button';button.textContent='Injected engineering mutation';\n",
    );
    expect(sliceTrainingTourErrors(vacuousEngineering))
      .toContain('slice-training-oracle-7');
  });
});
