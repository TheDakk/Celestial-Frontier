import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const between = (source: string, start: string, end: string): string => {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  return a >= 0 && b > a ? source.slice(a, b) : '';
};

/* The play-time harvest (v1.8.9 parity, 2026-09-25): the card button, the click route, the runner's guards and publication. */
function audit(source: string): string[] {
  const f: string[] = [];
  const actions = between(source, 'function buildCardActions(', '\nfunction refreshPlanetSurveyCard(');
  if (!actions.includes('harvestCardActionHtml(p)')) f.push('the world card does not render the Harvest action');
  const button = between(source, 'function harvestCardActionHtml(', '\nasync function runWorldHarvest(');
  if (!button.includes('projectWorldHarvestV1(save, p.seed, currentEcologyEpoch())')) f.push('the card does not read readiness from the published epoch');
  const route = between(source, "else if (a === 'harvest') {", '\n});');
  if (!route.includes('await runWorldHarvest(seed)')) f.push('the Harvest press is wired to nothing');
  const runner = between(source, 'async function runWorldHarvest(', "\nconst sideEl = document.createElement('div');");
  if (!runner.includes('commitWorldHarvestV1({ authority: runtime, state: sourceState, planetSeed, epoch, codecNow: Date.now() })')) f.push('the runner does not commit through the owner');
  if (!runner.includes('publishWorldHarvestFieldsV1(sourceState, outcome)')) f.push('the runner does not publish the durable result');
  if (!runner.includes('currentEcologyEpoch() !== epoch')) f.push('the runner does not refuse an epoch that moved before the write');
  if (!runner.includes('productActionCoordinator.tryClaim(operationForWorldHarvestV1(planetSeed, epoch))')) f.push('the runner does not claim its exact operation');
  if (!runner.includes('if (durable) queueArc9ProgressionRefresh(actionClaim.operation);')) f.push('the runner does not queue the progression catch-up');
  if (!source.includes(`'[data-act="share"]', '[data-act="harvest"]',`)) f.push('Harvest is not blocked while player mutation is held');
  if (/Date\.now\(\)/.test(button)) f.push('the card readiness reads the device clock');
  return f;
}

describe('world harvest wiring (Arc 6 play-time Stardust)', () => {
  it('the shipped main.ts wires the button, the route and the runner', () => { expect(audit(mainSource)).toEqual([]); });
  it('negative controls', () => {
    for (const [needle, replacement, expected] of [
      ['await runWorldHarvest(seed);', 'void seed;', /wired to nothing/],
      ['publishWorldHarvestFieldsV1(sourceState, outcome);', '', /does not publish/],
      ['    harvestCardActionHtml(p) +\n', '', /does not render/],
      ["'[data-act=\"share\"]', '[data-act=\"harvest\"]',", "'[data-act=\"share\"]',", /not blocked/],
      ['projectWorldHarvestV1(save, p.seed, currentEcologyEpoch())', 'projectWorldHarvestV1(save, p.seed, Date.now())', /published epoch|device clock/],
    ] as [string, string, RegExp][]) {
      expect(mainSource.split(needle).length, needle).toBe(2);
      expect(audit(mainSource.replace(needle, replacement)).join(' | '), needle).toMatch(expected);
    }
  });
});
