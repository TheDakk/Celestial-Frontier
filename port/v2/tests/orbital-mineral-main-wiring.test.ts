import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'main.ts'),
  'utf8',
);

const PRESENT_PLANET_SURVEY_CALL = [
  '  showSurvey(',
  '    d,',
  '    buildCardActions(p),',
  '    null,',
  '    orbitalMineralSurveyRows(star, resolved.planet),',
  '    preparedCaptureRoster,',
  '    approachEcology,',
  '  );',
].join('\n');

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end <= start) throw new Error(`source section is missing: ${startText}`);
  const body = source.slice(start, end);
  if (occurrences(body, needle) !== 1) {
    throw new Error(`source section must contain exactly one mutation target: ${needle}`);
  }
  return source.slice(0, start) + body.replace(needle, replacement) + source.slice(end);
}

function wiringErrors(source: string): string[] {
  const errors: string[] = [];
  if (occurrences(source, '  projectOrbitalMineralSurveyRow,') !== 1) {
    errors.push('projector-import');
  }

  const show = section(source, 'function showSurvey(', '\nfunction hideSurvey(');
  if (show.length === 0) errors.push('survey-render-section');
  if (!show.includes('supplementalRows: readonly SurveyPresentationRow[]')
    || !show.includes('...supplementalRows,')) errors.push('supplemental-row-path');
  if (!show.includes('<br>${esc(v)}</div>')) errors.push('supplemental-row-escaping');

  const dock = section(
    source,
    "surveyDockEl.addEventListener('click', () => {",
    '\nchartsDockEl.addEventListener',
  );
  const retained = section(
    dock,
    "if (card.style.display === 'none' && card.innerHTML && cardCtx) {",
    "\n  if (card.style.display === 'none' && card.innerHTML) {",
  );
  const retainedPresent = retained.indexOf(
    'if (presentPlanetSurvey(context.p, context.star, context.planet)) {',
  );
  const retainedFocus = retained.indexOf('surveyFocusReturn = surveyDockEl;', retainedPresent);
  const retainedReturn = retained.indexOf('return;', retainedFocus);
  if (!(retainedPresent >= 0 && retainedFocus > retainedPresent && retainedReturn > retainedFocus)) {
    errors.push('retained-card-reprojection');
  }

  const projector = section(
    source,
    'function orbitalMineralSurveyRows(',
    '\nfunction presentPlanetSurvey(',
  );
  if (projector.length === 0) {
    errors.push('orbital-projector-section');
  } else {
    if (!projector.includes("nav.mode !== 'system'")
      || !projector.includes('arc3EngineeringState === null')
      || !projector.includes('arc3EngineeringProtection !== null')) {
      errors.push('orbital-authority-gates');
    }
    for (const proof of [
      'getProvenStarKey(nav.star) !== getProvenStarKey(star)',
      'getProvenGalaxyKey(address.address.galaxy) !== getProvenGalaxyKey(nav.gal)',
      'getProvenStarKey(address.address.star) !== getProvenStarKey(star)',
      'getProvenPlanetKey(address.address.planet) !== getProvenPlanetKey(planet)',
    ]) {
      if (!projector.includes(proof)) errors.push('orbital-address-proof');
    }
    if (!projector.includes('const address = resolveCF1WorldAddress({')
      || !projector.includes('galaxy: { seed: nav.gal.seed, x: nav.gal.x, y: nav.gal.y },')
      || !projector.includes('star: { seed: star.seed, x: star.x, y: star.y },')
      || !projector.includes('planet: { seed: planet.seed },')) {
      errors.push('orbital-address-resolution');
    }
    if (!projector.includes('const row = projectOrbitalMineralSurveyRow({')
      || !projector.includes('engineering: arc3EngineeringState,')
      || !projector.includes('nav,\n    address: address.address,')) {
      errors.push('orbital-projector-inputs');
    }
    if (projector.includes('save.techOwned') || projector.includes('persistView(')
      || projector.includes('mineCurrentSurface(') || projector.includes('commitArc3EngineeringAction(')) {
      errors.push('orbital-read-only-boundary');
    }
  }

  const present = section(source, 'function presentPlanetSurvey(', '\nfunction startPlanetSurvey(');
  const proof = present.indexOf('|| !planetNodeForProof(star, resolved.planet)) return false;');
  const append = present.indexOf(PRESENT_PLANET_SURVEY_CALL);
  if (!(proof >= 0 && append > proof)) errors.push('planet-proof-before-projection');
  if (present.includes('playSurveyPing();') || present.includes("gameEvent('survey',")) {
    errors.push('survey-event-single-owner');
  }

  const refresh = section(source, 'function refreshPlanetSurveyCard(', '\nasync function surveyAndLand(');
  if (!refresh.includes("card.style.display === 'none'")
    || !refresh.includes('return presentPlanetSurvey(context.p, context.star, context.planet);')) {
    errors.push('visible-card-refresh');
  }
  const land = section(source, 'async function doLand(', '\nlet lastArc0AtlasOutcome:');
  const atlas = section(source, 'async function addToAtlas(', "\ncard.addEventListener('click'");
  const action = section(source, 'async function runEngineeringPanelAction(', '\nasync function smokeCommitF4Outcome(');
  if (occurrences(land, 'refreshPlanetSurveyCard();') !== 2) {
    errors.push('surface-refresh-removal');
  }
  if (!atlas.includes('refreshPlanetSurveyCard();')) errors.push('atlas-refresh-retention');
  if (!action.includes("if (outcome.operation === 'purchase-research') refreshPlanetSurveyCard();")) {
    errors.push('postcommit-research-refresh');
  }

  const surveyAction = section(source, 'function startPlanetSurvey(', '\nfunction buildCardActions(');
  if (occurrences(surveyAction, 'playSurveyPing();') !== 1
    || occurrences(surveyAction, "gameEvent('survey',") !== 1) errors.push('survey-event-single-owner');

  return [...new Set(errors)];
}

describe('v2 Deep Scanner — main Survey wiring', () => {
  it('uses the registered Arc 3 state and exact selected address through one escaped read-only row path', () => {
    expect(wiringErrors(mainSource)).toEqual([]);
  });

  it('negative-controls state protection, SystemNav, canonical address, and legacy-mirror substitution', () => {
    const noProtection = replaceInSectionExact(
      mainSource,
      'function orbitalMineralSurveyRows(',
      '\nfunction presentPlanetSurvey(',
      'arc3EngineeringProtection !== null',
      'false',
    );
    expect(wiringErrors(noProtection)).toContain('orbital-authority-gates');

    const surfaceLeak = replaceInSectionExact(
      mainSource,
      'function orbitalMineralSurveyRows(',
      '\nfunction presentPlanetSurvey(',
      "nav.mode !== 'system'",
      'false',
    );
    expect(wiringErrors(surfaceLeak)).toContain('orbital-authority-gates');

    const forgedLeaf = replaceInSectionExact(
      mainSource,
      'function orbitalMineralSurveyRows(',
      '\nfunction presentPlanetSurvey(',
      'planet: { seed: planet.seed },',
      'planet: { seed: 133 },',
    );
    expect(wiringErrors(forgedLeaf)).toContain('orbital-address-resolution');

    const legacyMirror = replaceInSectionExact(
      mainSource,
      'function orbitalMineralSurveyRows(',
      '\nfunction presentPlanetSurvey(',
      'engineering: arc3EngineeringState,',
      "engineering: { ...arc3EngineeringState, research: save.techOwned },",
    );
    expect(wiringErrors(legacyMirror)).toEqual(expect.arrayContaining([
      'orbital-projector-inputs',
      'orbital-read-only-boundary',
    ]));
  });

  it('negative-controls proof ordering, escaped output, and a read path that starts writing', () => {
    const skippedProof = replaceInSectionExact(
      mainSource,
      'function presentPlanetSurvey(',
      '\nfunction startPlanetSurvey(',
      '|| !planetNodeForProof(star, resolved.planet)) return false;',
      '|| false) return false;',
    );
    expect(wiringErrors(skippedProof)).toContain('planet-proof-before-projection');

    const unescaped = replaceInSectionExact(
      mainSource,
      'function showSurvey(',
      '\nfunction hideSurvey(',
      '<br>${esc(v)}</div>',
      '<br>${v}</div>',
    );
    expect(wiringErrors(unescaped)).toContain('supplemental-row-escaping');

    const writingProjector = replaceInSectionExact(
      mainSource,
      'function orbitalMineralSurveyRows(',
      '\nfunction presentPlanetSurvey(',
      '  const address = resolveCF1WorldAddress({',
      '  void persistView();\n  const address = resolveCF1WorldAddress({',
    );
    expect(wiringErrors(writingProjector)).toContain('orbital-read-only-boundary');
  });

  it('negative-controls immediate/reload refresh ownership and duplicate Survey effects', () => {
    const staleRetainedCard = replaceInSectionExact(
      mainSource,
      "surveyDockEl.addEventListener('click', () => {",
      '\nchartsDockEl.addEventListener',
      "    if (presentPlanetSurvey(context.p, context.star, context.planet)) {\n" +
        "      /* Rebuilding may infer the still-focused canvas as an opener. The\n" +
        "         explicit dock activation owns the final return lineage. */\n" +
        "      surveyFocusReturn = surveyDockEl;\n" +
        "      return;\n" +
        "    }",
      '    if (card.innerHTML) return;',
    );
    expect(wiringErrors(staleRetainedCard)).toContain('retained-card-reprojection');

    const noCommitRefresh = replaceInSectionExact(
      mainSource,
      'async function runEngineeringPanelAction(',
      '\nasync function smokeCommitF4Outcome(',
      "if (outcome.operation === 'purchase-research') refreshPlanetSurveyCard();",
      "if (outcome.operation === 'purchase-research') updateChips();",
    );
    expect(wiringErrors(noCommitRefresh)).toContain('postcommit-research-refresh');

    const retainedOnSurface = replaceInSectionExact(
      mainSource,
      'async function doLand(',
      '\nlet lastArc0AtlasOutcome:',
      '      buildCurrentSceneTransaction(); triggerCameraShake(); hudText(); updateChips();\n' +
        '      refreshPlanetSurveyCard();',
      '      buildCurrentSceneTransaction(); triggerCameraShake(); hudText(); updateChips();\n' +
        '      updateChips();',
    );
    expect(wiringErrors(retainedOnSurface)).toContain('surface-refresh-removal');

    const duplicatePing = replaceInSectionExact(
      mainSource,
      'function presentPlanetSurvey(',
      '\nfunction startPlanetSurvey(',
      PRESENT_PLANET_SURVEY_CALL,
      `  playSurveyPing();\n${PRESENT_PLANET_SURVEY_CALL}`,
    );
    expect(wiringErrors(duplicatePing)).toContain('survey-event-single-owner');
  });
});
