import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');

function section(candidate: string, startText: string, endText: string): string {
  const start = candidate.indexOf(startText);
  const end = candidate.indexOf(endText, start);
  return start >= 0 && end > start ? candidate.slice(start, end) : '';
}

function errors(candidate: string): string[] {
  const result: string[] = [];
  const setup = section(
    candidate,
    'function prepareTrainingForgePracticeSurface()',
    '\nfunction runTrainingForgePracticeRequest(',
  );
  const action = section(
    candidate,
    'function runTrainingForgePracticeRequest(',
    '\nfunction shipyardDiagnostics()',
  );
  if (!candidate.includes('createTrainingForgePracticeAdapterV1,')
    || !candidate.includes('const trainingForgePractice = createTrainingForgePracticeAdapterV1();')) {
    result.push('Main does not own one versioned Training Forge adapter');
  }
  for (const proof of [
    "trainingStepId() !== 'engineering-forge-practice'",
    'state: save,', 'extensions: runtime.extensions,', 'codecNow: Date.now(),',
    '[data-recipe-id="${TRAINING_FORGE_IRON_PLATE_BASE_ID_V1}"]',
    "button.dataset.trainingForgePractice = 'true';",
    "button.dataset.modelEnabled = 'true';",
    'fabricator.open = true;', 'refreshTrainingScope();',
  ]) if (!setup.includes(proof)) result.push(`practice setup omits ${proof}`);
  for (const proof of [
    "request.operation !== 'fabricate'",
    'request.id !== TRAINING_FORGE_IRON_PLATE_BASE_ID_V1',
    'engineeringPanelController.setPending(request);',
    'trainingForgePractice.fabricate()',
    'engineeringPanelController.setPending(null);',
    'gameEvent(outcome.completion.event.type, { ...outcome.completion.event.detail });',
    'trainingForgePractice.exit();',
    'refreshEngineeringPanelState();',
    'refreshTrainingScope();',
  ]) if (!action.includes(proof)) result.push(`practice action omits ${proof}`);
  if (/commitArc3EngineeringAction|fabricateFixedEngineeringRecipe|commitAction|commitOutcome|revisionRepo\.mutate/u.test(action)) {
    result.push('Training practice crosses a live F4 writer');
  }
  if (!candidate.includes('if (runTrainingForgePracticeRequest(request)) return;')
    || !candidate.includes("gameEvent('panel-open', { id: 'shipyard', open: true });\n    prepareTrainingForgePracticeSurface();")) {
    result.push('native Engineering emission does not enter the isolated practice path');
  }
  if (!candidate.includes('trainingForgePractice.exit();\n    engineeringPanelRegistration.onClose();')
    || !candidate.includes('trainingForgePractice.dispose();\n    engineeringPanelReleased = true;')) {
    result.push('panel/replacement lifecycle does not release the Training sandbox');
  }
  return result;
}

describe('Training Forge Main wiring', () => {
  it('turns the native Iron Plate control into one isolated hands-on lesson', () => {
    expect(errors(source)).toEqual([]);
  });

  it('negative-controls live-writer isolation and sandbox cleanup', () => {
    expect(errors(source.replace(
      '\nfunction shipyardDiagnostics()',
      '\nvoid commitAction();\nfunction shipyardDiagnostics()',
    ))).toContain('Training practice crosses a live F4 writer');
    expect(errors(source.replace(
      '    trainingForgePractice.exit();\n    engineeringPanelRegistration.onClose();',
      '    engineeringPanelRegistration.onClose();',
    ))).toContain('panel/replacement lifecycle does not release the Training sandbox');
  });
});
