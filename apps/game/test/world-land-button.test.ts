// The Land button of the survey card, as the legacy game has it (LEGACY celestial-frontier.html; lines cited are that file's).
import { describe, expect, it } from 'vitest';
import * as world from '../src/world';
import { LAND_BUTTON, landButtonStep } from '../src/world';

describe('the Land button', () => {
  it('LEGACY 14094, 14334: its word, its tip, and the notice when the world is not in the current view', () => {
    expect(LAND_BUTTON).toEqual({
      label: 'Land',
      tip: 'Drop out of orbit and stand on this world — ground surveys open a world’s secrets.',
      awayTitle: 'Landing',
      awayText: 'Dive toward this world and confirm the descent — planetfall turns your orbital survey into a ground survey.',
    });
  });

  it('LEGACY 14330-14336, 13664-13679: the press lands at once; there is no survey step, prompt or warning before it', () => {
    expect(landButtonStep({ inView: true, tutDone: true, earth: false, landed: true, cleared: false })).toBe('land');
    expect('runSurveyLandHandoff' in world).toBe(false);
  });

  it('LEGACY 13435-13437, 13669: training, Earth, a world landed on before, or a cleared descent land with no roll; any other world rolls its descent first', () => {
    const fresh = { inView: true, tutDone: true, earth: false, landed: false, cleared: false };
    expect(landButtonStep(fresh)).toBe('roll-descent');
    expect(landButtonStep({ ...fresh, tutDone: false })).toBe('land');
    expect(landButtonStep({ ...fresh, earth: true })).toBe('land');
    expect(landButtonStep({ ...fresh, landed: true })).toBe('land');
    expect(landButtonStep({ ...fresh, cleared: true })).toBe('land');
  });

  it('LEGACY 14333-14334: a world that is not in the current system view gets the notice, and nothing lands', () => {
    expect(landButtonStep({ inView: false, tutDone: true, earth: true, landed: true, cleared: true })).toBe('notice');
  });
});
