/* hybridblendcheck.mjs — outcome guard for Earth-lineage breeding art.

   A bred genome has no `_earthName`; `_earthBlend` is what preserves its
   Earth parent's rig while the inherited genome supplies palette and drift.
   Fauna hybrids remain on the lineage-aware verbatim route; flora, fungi and
   microbe hybrids use the exact kingdom+name owner with the child genome.
   This drives the real browser renderer and fails if production pixels bypass
   either route, if cache identity collapses lineages/anchors, or if the
   procedural negative control stops exercising an override.

   Usage: node tools/hybridblendcheck.mjs
*/
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const edgeFile = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validate(report) {
  assert(report && report.done === true, 'browser did not produce a completed hybrid report');
  assert(report.checks && typeof report.checks === 'object', 'hybrid report omitted checks');
  const required = [
    'proceduralControlDiffersFromVerbatim',
    'productionBlendEqualsVerbatim',
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
    'faunaUsesVerbatimLineageRoute',
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
  assert(Array.isArray(report.focusLineages) && report.focusLineages.length === 4,
    'hybrid report must contain four focused kingdom lineages');
  const kingdoms = new Set();
  for (const lineage of report.focusLineages) {
    assert(lineage && typeof lineage === 'object' && typeof lineage.kingdom === 'string',
      'focused lineage is malformed');
    kingdoms.add(lineage.kingdom);
    assert(Array.isArray(lineage.stages) && lineage.stages.length === stageIds.length,
      `${lineage.id}: focused lineage omitted a stage`);
    lineage.stages.forEach((stage, index) => {
      assert(stage.id === stageIds[index], `${lineage.id}: bad stage order at ${index}`);
      assert(Math.abs(Number(stage.anchor) - anchors[index]) < 1e-9,
        `${lineage.id}/${stage.id}: wrong anchor`);
      const expectedRoute = index === 0 ? 'named-owned'
        : lineage.kingdom === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
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
      const expectedRoute = row.kingdom === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
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
    const expectedRoute = row.expectedLineageKingdom === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
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
  assert(report.pass === true && Array.isArray(report.errors) && report.errors.length === 0,
    `hybrid report did not pass: ${JSON.stringify(report.errors || [])}`);
}

function injectedFailureControl(report) {
  const mutations = [
    ['fauna route bypass', (broken) => { broken.focusLineages[0].stages[2].route = 'lineage-owned'; }],
    ['flora route bypass', (broken) => { broken.focusLineages[1].stages[2].route = 'lineage-verbatim'; }],
    ['fungi stripped-lineage bypass', (broken) => { broken.focusLineages[2].stages[3].strippedDiffers = false; }],
    ['microbe stripped-lineage bypass', (broken) => { broken.focusLineages[3].stages[4].strippedDiffers = false; }],
    ['cross-kingdom selector collapse', (broken) => { broken.duplicateRouteResults[0].kingdomPixelsDistinct = false; }],
    ['mixed-kingdom owner loss', (broken) => { broken.mixedKingdomResults[0].lineageKingdom = 'fauna'; }],
    ['duplicate-name owner loss', (broken) => { broken.duplicateMixedResults[0].lineageKingdom = 'microbe'; }],
    ['catalogue non-fauna route bypass', (broken) => { broken.nonFaunaRouteCoverage[1].unowned = ['Injected bypass']; }],
    ['swapped-parent cache collapse', (broken) => { broken.checks.swappedParentPixelsStayDistinct = false; }],
  ];
  for (const [label, mutate] of mutations) {
    const broken = structuredClone(report);
    mutate(broken);
    let rejected = false;
    try { validate(broken); } catch { rejected = true; }
    assert(rejected, `negative control failed: simulated ${label} was accepted`);
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      assert(address && typeof address === 'object', 'free-port probe returned no address');
      probe.close(() => resolve(address.port));
    });
  });
}

assert(fs.existsSync(edgeFile), `Edge executable not found at ${edgeFile}`);
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

let edge = null;
let socket = null;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-hybrid-check-'));
try {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browserPort = await freePort();
  edge = spawn(edgeFile, [
    '--headless=new', '--no-sandbox', '--no-first-run',
    '--disable-component-extensions-with-background-pages', '--disable-component-update',
    '--disable-background-networking', `--remote-debugging-port=${browserPort}`,
    `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });

  let webSocketUrl = null;
  for (let attempt = 0; attempt < 50 && !webSocketUrl; attempt++) {
    await sleep(300);
    try {
      const response = await fetch(`http://127.0.0.1:${browserPort}/json/version`);
      webSocketUrl = (await response.json()).webSocketDebuggerUrl;
    } catch { /* browser boot */ }
  }
  assert(webSocketUrl, 'headless browser did not expose CDP');
  socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error('CDP WebSocket failed to open'));
  });

  let messageId = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const promise = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) promise.reject(new Error(message.error.message));
    else promise.resolve(message.result);
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++messageId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
  });
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await send('Runtime.enable', {}, sessionId);
  const appPort = server.address().port;
  await send('Page.navigate', { url: `http://127.0.0.1:${appPort}/audit.html?hybrid=1` }, sessionId);

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
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
  injectedFailureControl(report);
  console.log('HYBRID BLEND CHECK PASS');
  console.log(`  fauna hybrids: lineage-aware verbatim route (control seed ${report.seed})`);
  console.log('  flora/fungi/microbe hybrids: exact kingdom+name owner route');
  console.log(`  non-fauna catalogue owned coverage: ${report.nonFaunaRouteCoverage
    .map((row) => `${row.kingdom}=${row.catalogueCount}`).join(', ')}`);
  console.log('  five-stage, stripped-lineage, duplicate-name, cache outcomes: verified');
  console.log('  nine injected route/cache/lineage regressions: rejected');
} finally {
  if (socket) socket.close();
  if (edge) edge.kill();
  await new Promise((resolve) => server.close(resolve));
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* OS cleanup can lag */ }
}
