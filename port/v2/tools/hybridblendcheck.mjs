/* hybridblendcheck.mjs — outcome guard for Earth-lineage breeding art.

   A bred genome has no `_earthName`; `_earthBlend` is what preserves its
   Earth parent's rig while the inherited genome supplies palette and drift.
   Seven reviewed fauna lineages use their modern named whole-form owner;
   compatibility fauna remains verbatim, and flora/fungi/microbe use their exact
   kingdom+name owner. This drives the real browser renderer and fails if
   production pixels bypass either route, if cache identity collapses
   lineages/anchors, or if a negative control stops exercising its outcome.

   Usage: node tools/hybridblendcheck.mjs
*/
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reviewedFaunaLineages = new Set([
  'Fruit Bat', 'Eagle', 'Wolf', 'Elephant', 'Chameleon', 'Dragonfly', 'Octopus',
]);
const expectedLineageRoute = (kingdom, name) =>
  kingdom !== 'fauna' || reviewedFaunaLineages.has(name) ? 'lineage-owned' : 'lineage-verbatim';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validate(report) {
  assert(report && report.done === true, 'browser did not produce a completed hybrid report');
  assert(report.checks && typeof report.checks === 'object', 'hybrid report omitted checks');
  const required = [
    'proceduralControlDiffersFromVerbatim',
    'reviewedFaunaBlendUsesOwnedRoute',
    'blendDiffersFromProcedural',
    'lineagesHaveDistinctPixels',
    'anchorValuesHaveDistinctPixels',
    'repeatedBlendIsStable',
    'actualCrossesWriteLineage',
    'actualCrossPixelsUseLineage',
    'earthEarthRetainsMoreAnchorThanEarthAlien',
    'multigenerationAnchorDrifts',
    'faunaAndFloraCrossesCovered',
    'allKingdomsCovered',
    'reviewedFaunaUsesOwnedLineageRoute',
    'protectedFaunaUsesVerbatimLineageRoute',
    'purePathsStayNamedOwned',
    'nonFaunaUsesOwnedNamedRoute',
    'nonFaunaProductionMatchesOwnedRoute',
    'floraLineageDiffersWhenStripped',
    'fungiLineageDiffersWhenStripped',
    'microbeLineageDiffersWhenStripped',
    'fiveStageTargetsRendered',
    'anchorTargetsExact',
    'focusedStagePixelsStayDistinct',
    'productionMatchesFreshRoute',
    'strippedControlsMatchFreshRoute',
    'crossKingdomDuplicateRoutesAreSetSpecific',
    'mixedKingdomLineageOwnerSurvives',
    'mixedKingdomRouteUsesLineageOwner',
    'duplicateNameMixedKingdomOwnerSurvives',
    'nonFaunaCatalogueBlendRoutesOwned',
    'swappedParentsShareSeedButDifferGenome',
    'swappedParentPixelsStayDistinct',
    'repeatedCrossIsDeterministic',
  ];
  for (const name of required) assert(report.checks[name] === true, `hybrid outcome failed: ${name}`);
  const stageIds = ['pure-earth', 'earth-earth-0.90', 'earth-alien-0.73', 'next-alien-0.46', 'floor-0.22'];
  const anchors = [1, 0.9, 0.73, 0.46, 0.22];
  const expectedFocusLineages = [
    { id: 'fauna-wolf', kingdom: 'fauna', name: 'Wolf' },
    { id: 'flora-apple', kingdom: 'flora', name: 'Apple' },
    { id: 'fungi-oyster-mushroom', kingdom: 'fungi', name: 'Oyster Mushroom' },
    { id: 'microbe-amoeba', kingdom: 'microbe', name: 'Amoeba' },
    { id: 'flora-vanilla-orchid', kingdom: 'flora', name: 'Vanilla Orchid' },
  ];
  assert(Array.isArray(report.focusLineages)
    && report.focusLineages.length === expectedFocusLineages.length,
    'hybrid report must contain five focused lineages');
  const kingdoms = new Set();
  for (let focusIndex = 0; focusIndex < expectedFocusLineages.length; focusIndex++) {
    const lineage = report.focusLineages[focusIndex];
    const expectedLineage = expectedFocusLineages[focusIndex];
    assert(lineage && typeof lineage === 'object'
      && typeof lineage.id === 'string'
      && typeof lineage.kingdom === 'string'
      && typeof lineage.name === 'string',
      'focused lineage is malformed');
    assert(lineage.id === expectedLineage.id
      && lineage.kingdom === expectedLineage.kingdom
      && lineage.name === expectedLineage.name,
    `focused lineage ${focusIndex} must be exact ${expectedLineage.kingdom}|${expectedLineage.name}`);
    kingdoms.add(lineage.kingdom);
    assert(Array.isArray(lineage.stages) && lineage.stages.length === stageIds.length,
      `${lineage.id}: focused lineage omitted a stage`);
    lineage.stages.forEach((stage, index) => {
      assert(stage.id === stageIds[index], `${lineage.id}: bad stage order at ${index}`);
      assert(Math.abs(Number(stage.anchor) - anchors[index]) < 1e-9,
        `${lineage.id}/${stage.id}: wrong anchor`);
      const expectedRoute = index === 0 ? 'named-owned'
        : expectedLineageRoute(lineage.kingdom, lineage.name);
      assert(stage.route === expectedRoute && stage.expectedRoute === expectedRoute,
        `${lineage.id}/${stage.id}: wrong production route`);
      assert(stage.productionMatchesFresh === true && stage.repeatedProductionStable === true,
        `${lineage.id}/${stage.id}: production/fresh route or repeat diverged`);
      if (index > 0) {
        assert(stage.strippedDiffers === true && stage.strippedProductionMatchesFresh === true,
          `${lineage.id}/${stage.id}: lineage-bypass control was accepted`);
        assert(/^procedural-(owned|verbatim)$/.test(stage.strippedRoute),
          `${lineage.id}/${stage.id}: stripped control retained a lineage route`);
      }
    });
    assert(lineage.stagePixelsDistinct === true, `${lineage.id}: five stage portraits collapsed`);
  }
  assert([...kingdoms].sort().join(',') === 'fauna,flora,fungi,microbe',
    'focused lineages do not cover all four kingdoms');

  const duplicateSets = new Map([
    ['Green Algae', 'flora,microbe'],
    ['Snow Algae', 'flora,microbe'],
    ['Reindeer Lichen', 'flora,fungi'],
    ['Tardigrade', 'fauna,microbe'],
  ]);
  assert(Array.isArray(report.duplicateRouteResults)
    && report.duplicateRouteResults.length === duplicateSets.size,
  'cross-kingdom duplicate report is incomplete');
  for (const pair of report.duplicateRouteResults) {
    assert(duplicateSets.has(pair.name), `unexpected cross-kingdom duplicate ${pair.name}`);
    assert(pair.sameDerivedSeed === true && pair.kingdomPixelsDistinct === true,
      `${pair.name}: same-seed kingdom selector collapsed`);
    assert(Array.isArray(pair.rows) && pair.rows.length === 2,
      `${pair.name}: expected two kingdom rows`);
    assert(pair.rows.map((row) => row.kingdom).sort().join(',') === duplicateSets.get(pair.name),
      `${pair.name}: wrong kingdom pair`);
    for (const row of pair.rows) {
      const expectedRoute = expectedLineageRoute(row.kingdom, pair.name);
      assert(row.route === expectedRoute && row.expectedRoute === expectedRoute,
        `${pair.name}/${row.kingdom}: wrong owner`);
      assert(row.productionMatchesFresh === true && row.strippedDiffers === true,
        `${pair.name}/${row.kingdom}: route outcome failed`);
    }
  }
  assert(Array.isArray(report.mixedKingdomResults) && report.mixedKingdomResults.length === 8,
    'mixed-kingdom report must cover two owners, both parent orders and both child kingdoms');
  assert(Array.isArray(report.duplicateMixedResults) && report.duplicateMixedResults.length === 8,
    'duplicate-name mixed report must cover both owners, orders and child kingdoms');
  for (const row of [...report.mixedKingdomResults, ...report.duplicateMixedResults]) {
    assert(row.lineage === row.expectedLineage
      && row.lineageKingdom === row.expectedLineageKingdom,
    `${row.label}: Earth lineage catalogue owner was not preserved`);
    const expectedRoute = expectedLineageRoute(row.expectedLineageKingdom, row.expectedLineage);
    assert(row.route === expectedRoute && row.expectedRoute === expectedRoute,
      `${row.label}: renderer followed child kingdom rather than lineage owner`);
    assert(row.productionMatchesFresh === true && row.strippedDiffers === true,
      `${row.label}: mixed-kingdom production/negative control failed`);
  }
  assert(Array.isArray(report.nonFaunaRouteCoverage) && report.nonFaunaRouteCoverage.length === 3,
    'non-fauna catalogue route coverage is incomplete');
  const coverage = new Map(report.nonFaunaRouteCoverage.map((row) => [row.kingdom, row]));
  for (const [kingdom, minimum] of [['flora', 300], ['fungi', 20], ['microbe', 20]]) {
    const row = coverage.get(kingdom);
    assert(row && Number.isInteger(row.catalogueCount) && row.catalogueCount >= minimum
      && Array.isArray(row.unowned) && row.unowned.length === 0,
    `${kingdom}: catalogue Earth-lineage children are not all named-owner routed`);
  }
  const protectedNames = ['Sea Turtle', 'Great White Shark'];
  assert(Array.isArray(report.protectedFaunaLineages)
    && report.protectedFaunaLineages.length === protectedNames.length,
  'protected fauna report must contain Sea Turtle and Great White Shark');
  for (let lineageIndex = 0; lineageIndex < protectedNames.length; lineageIndex++) {
    const lineage = report.protectedFaunaLineages[lineageIndex];
    assert(lineage?.name === protectedNames[lineageIndex]
      && Array.isArray(lineage.stages) && lineage.stages.length === stageIds.length,
    `protected fauna row ${lineageIndex} is missing or substituted`);
    lineage.stages.forEach((stage, index) => {
      const expectedRoute = index === 0 ? 'named-owned' : 'lineage-verbatim';
      assert(stage.id === stageIds[index] && Math.abs(Number(stage.anchor) - anchors[index]) < 1e-9,
        `${lineage.name}: protected stage identity/anchor changed`);
      assert(stage.route === expectedRoute && stage.expectedRoute === expectedRoute
        && stage.productionMatchesFresh === true && stage.repeatedProductionStable === true
        && stage.lineage === lineage.name,
      `${lineage.name}/${stage.id}: protected route or pixels changed`);
    });
  }
  assert(report.pass === true && Array.isArray(report.errors) && report.errors.length === 0,
    `hybrid report did not pass: ${JSON.stringify(report.errors || [])}`);
}

function injectedFailureControl(report) {
  const mutations = [
    ['reviewed fauna route bypass', (broken) => { broken.focusLineages[0].stages[2].route = 'lineage-verbatim'; }],
    ['flora route bypass', (broken) => { broken.focusLineages[1].stages[2].route = 'lineage-verbatim'; }],
    ['fungi stripped-lineage bypass', (broken) => { broken.focusLineages[2].stages[3].strippedDiffers = false; }],
    ['microbe stripped-lineage bypass', (broken) => { broken.focusLineages[3].stages[4].strippedDiffers = false; }],
    ['cross-kingdom selector collapse', (broken) => { broken.duplicateRouteResults[0].kingdomPixelsDistinct = false; }],
    ['mixed-kingdom owner loss', (broken) => { broken.mixedKingdomResults[0].lineageKingdom = 'fauna'; }],
    ['duplicate-name owner loss', (broken) => { broken.duplicateMixedResults[0].lineageKingdom = 'microbe'; }],
    ['catalogue non-fauna route bypass', (broken) => { broken.nonFaunaRouteCoverage[1].unowned = ['Injected bypass']; }],
    ['swapped-parent cache collapse', (broken) => { broken.checks.swappedParentPixelsStayDistinct = false; }],
    ['Vanilla stage collapse', (broken) => { broken.focusLineages[4].stagePixelsDistinct = false; }],
    ['focused species substitution', (broken) => { broken.focusLineages[4].name = 'Apple'; }],
    ['protected fauna route widening', (broken) => { broken.protectedFaunaLineages[0].stages[2].route = 'lineage-owned'; }],
    ['protected fauna substitution', (broken) => { broken.protectedFaunaLineages[1].name = 'Hammerhead Shark'; }],
    ['pure route bypass', (broken) => { broken.protectedFaunaLineages[0].stages[0].route = 'lineage-owned'; }],
  ];
  for (const [label, mutate] of mutations) {
    const broken = structuredClone(report);
    mutate(broken);
    let rejected = false;
    try { validate(broken); } catch { rejected = true; }
    assert(rejected, `negative control failed: simulated ${label} was accepted`);
  }
  return mutations.length;
}

execSync('npx vite build', { cwd: appDir, stdio: 'inherit' });

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
const server = http.createServer((request, response) => {
  const file = path.join(dist, request.url === '/' ? 'index.html' : request.url.split('?')[0]);
  try {
    const bytes = fs.readFileSync(file);
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    response.end(bytes);
  } catch {
    response.writeHead(404);
    response.end();
  }
});

let browser = null;
try {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  browser = await openChromiumCdp({
    label: 'hybrid blend check', userDataPrefix: 'cf-hybrid-blend-check-browser',
    commandTimeoutMs: 15000, startupTimeoutMs: 15000, shutdownTimeoutMs: 5000,
  });
  const target = await browser.send('Target.createTarget', { url: 'about:blank' });
  const attached = await browser.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await browser.send('Runtime.enable', {}, sessionId);
  await browser.send('Page.enable', {}, sessionId);
  const appPort = server.address().port;
  await browser.send('Page.navigate', { url: `http://127.0.0.1:${appPort}/audit.html?hybrid=1` }, sessionId);

  const evaluate = async (expression) => {
    const result = await browser.send('Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result.exceptionDetails) throw new Error(`browser evaluation failed: ${result.exceptionDetails.text}`);
    return result.result.value;
  };
  let report = null;
  for (let attempt = 0; attempt < 300 && !report; attempt++) {
    await sleep(200);
    report = await evaluate('(window.__CF_HYBRID__&&window.__CF_HYBRID__.done&&window.__CF_HYBRID__)||null');
  }
  if (!report?.pass) console.error(`  browser report: ${JSON.stringify(report)}`);
  validate(report);
  const rejectedRegressions = injectedFailureControl(report);
  console.log('HYBRID BLEND CHECK PASS');
  console.log(`  reviewed fauna hybrids: exact seven-name modern owner route (control seed ${report.seed})`);
  console.log('  protected/unreviewed fauna hybrids: compatibility verbatim route');
  console.log('  flora/fungi/microbe hybrids: exact kingdom+name owner route');
  console.log(`  non-fauna catalogue owned coverage: ${report.nonFaunaRouteCoverage
    .map((row) => `${row.kingdom}=${row.catalogueCount}`).join(', ')}`);
  console.log('  five-stage, stripped-lineage, duplicate-name, cache outcomes: verified');
  console.log(`  ${rejectedRegressions} injected route/cache/lineage/identity regressions: rejected`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
