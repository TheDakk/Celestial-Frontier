import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const MAIN_URL = new URL('../apps/game/src/main.ts', import.meta.url);
const SMOKE_URL = new URL('../tools/slicesmoke.mjs', import.meta.url);

function sourceSection(source: string, start: string, end: string): string {
  const left = source.indexOf(start);
  const right = source.indexOf(end, left);
  return left >= 0 && right > left ? source.slice(left, right) : '';
}

function landingWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const publisher = sourceSection(
    source,
    'function publishArc0LandingFields(',
    '\nasync function doLand(): Promise<boolean> {',
  );
  const body = sourceSection(
    source,
    'async function doLand(): Promise<boolean> {',
    '\nlet lastArc0AtlasOutcome:',
  );
  if (body.length === 0) return ['landing-source-section'];
  const waveOffPublisher = sourceSection(
    publisher,
    "  if (facts.descent.kind === 'wave-off') {",
    '\n  save.savedView =',
  );
  const claim = body.indexOf('const actionClaim = productActionCoordinator.tryClaim(operation);');
  const hold = body.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);', claim);
  const heartbeat = body.indexOf('await settleF4Heartbeat();', hold);
  const commit = body.indexOf('attempt = await commitArc0LandingAction({', heartbeat);
  const durable = body.indexOf('durable = true;', commit);
  const checkpoint = body.indexOf('const checkpoint = runtime.checkpointParent();', durable);
  const starterGear = body.indexOf('const loaded = readArc2Loot(runtime.extensions);', checkpoint);
  const publish = body.indexOf('publishArc0LandingFields(attempt.transaction.state, facts);', durable);
  const inventory = body.indexOf('inventoryPanelController.setState(arc2LootState);', publish);
  const identity = body.indexOf('worldIdentityState = attempt.verification.worldIdentity.state;', inventory);
  const event = body.indexOf("gameEvent('landfall', { planetSeed: p.seed });", identity);
  const settle = body.indexOf('actionClaim.settle(durable);', event);
  if (!(claim >= 0 && hold > claim && heartbeat > hold && commit > heartbeat
    && durable > commit && checkpoint > durable && starterGear > checkpoint && publish > starterGear
    && inventory > publish && identity > inventory
    && event > identity && settle > event)) errors.push('landing-durable-order');
  if ((body.match(/commitArc0LandingAction\(/gu) ?? []).length !== 1) {
    errors.push('landing-single-writer');
  }
  if (body.includes('persistView(')
    || body.includes('recordCanonicalWorldLanding(')
    || body.includes('bankLandfall(')) errors.push('landing-no-optimistic-writer');
  if (!body.includes('if (trainingCheckpointWriteHeld)')
    || !body.includes("lastArc0LandingOutcome = 'training-write-held';")
    || !body.includes("lastArc0LandingOutcome = 'training-route-only';")
    || !body.includes('replacementReloadPending || trainingCheckpointWriteHeld)')) {
    errors.push('landing-training-route-only');
  }
  if (!body.includes("if ((facts.permanentLanding && facts.landing === 'first')")
    || !body.includes("|| (p.seed === 133 && training && trainingStepId() === 'land'))")) {
    errors.push('landing-training-event-fence');
  }
  if (!body.includes("const faultInjection = !__CF_EVIDENCE_BUILD__ ? null : smokeRejectNextArc0LandingStorage")
    || !body.includes("if (faultInjection === 'storage-failure') smokeRejectArc0LandingStorageBoundary = true;")
    || !body.includes("if (faultInjection === 'storage-failure') smokeRejectArc0LandingStorageBoundary = false;")
    || !body.includes('await revisionRepo.mutate({')
    || !body.includes('lastSmokeArc0LandingFaultWitness = Object.freeze({')) {
    errors.push('landing-fault-evidence');
  }
  if (!body.includes('if (__CF_EVIDENCE_BUILD__ && smokeRejectNextArc0LandingPublication)')
    || !body.includes("outcome: 'committed-publication-reload'")
    || !body.includes("lastArc0LandingOutcome = 'committed-publication-reload';")) {
    errors.push('landing-postcommit-convergence');
  }
  if (!body.includes('runtime !== f4Runtime')
    || !body.includes('runtime.revision !== attempt.transaction.revision')
    || !body.includes('JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)')) {
    errors.push('landing-runtime-checkpoint-proof');
  }
  if (!publisher.includes('if (facts.starterCharters.changed) {')
    || !publisher.includes('save.chacc = committed.chacc.slice();')
    || !publisher.includes('save.chDone = committed.chDone.slice();')
    || !publisher.includes('save.chProg = { ...committed.chProg };')
    || !publisher.includes('save.items = committed.items.map(')
    || !publisher.includes('save.equip = { ...committed.equip };')
    || !publisher.includes('save.equipAff = Object.fromEntries(')
    || !publisher.includes('facts.achievement !== null || facts.starterCharters.changed')
    || !publisher.includes("facts.sample?.kind === 'reward' || facts.starterCharters.changed")) {
    errors.push('landing-starter-charter-publication');
  }
  if (!waveOffPublisher.includes('save.hp = committed.hp;')
    || !waveOffPublisher.includes('return;')
    || /save\.(?:savedView|landed|ascCh|ascProg|chacc|chDone|chProg|cargo|essence|stats|items|equip|equipAff|unlocked)\s*=/u
      .test(waveOffPublisher)) {
    errors.push('landing-wave-off-publication-fence');
  }
  if (!body.includes("if (facts.descent.kind === 'landed')")
    || !body.includes('attempt.arc2LootState === null')
    || !body.includes('JSON.stringify(encodeArc2LootCarrier(loaded.state))')
    || !body.includes('JSON.stringify(encodeArc2LootCarrier(attempt.arc2LootState))')
    || !body.includes('arc2LootLegacyMirrorMatches(loaded.state, attempt.transaction.state)')
    || !body.includes('committedLandingLootState = loaded.state;')) {
    errors.push('landing-exact-arc2-fixed-point');
  }
  if (!body.includes('lastStarterCharterAcceptStatus = `Completed ${titles}. Reward: ${rewards}.`;')
    || !body.includes('Starter Charter complete')
    || !body.includes("if (openPanelId() === 'rec') fillRecords();")) {
    errors.push('landing-starter-charter-presentation');
  }
  if (!body.includes('...facts.starterCharters.addedAchievementIds')
    || !body.includes('...(facts.achievement?.added ? [facts.achievement.id] : [])')
    || !body.includes('addedAchievementIds: landingAchievementIds')) {
    errors.push('landing-combined-progression-facts');
  }
  if (!body.includes('const restoreLandingPublication = (): void => {')
    || (body.match(/restoreLandingPublication\(\);/gu) ?? []).length < 2) {
    errors.push('landing-starter-charter-rollback');
  }
  return errors;
}

function trainingRouteWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const body = sourceSection(
    source,
    'async function routeTrainingForSmoke(selector: unknown): Promise<boolean> {',
    '\nfunction activeCardPlanetState()',
  );
  if (body.length === 0) return ['training-route-source-section'];
  const held = body.indexOf('!trainingCheckpointWriteHeld');
  const active = body.indexOf('!trainingActive()', held);
  const system = body.indexOf("nav.mode !== 'system'", active);
  const selector = body.indexOf('!Number.isInteger(value.seed) || !Number.isInteger(value.ordinal)', system);
  const present = body.indexOf('presentPlanetSurvey(p, nav.star)', selector);
  const land = body.indexOf('return doLand();', present);
  if (!(held >= 0 && active > held && system > active && selector > system
    && present > selector && land > present)) errors.push('training-route-proof-order');
  if (body.includes('startPlanetSurvey(') || body.includes('surveyPlanet(')
    || body.includes('surveyAndLand(') || body.includes('persistView(')
    || body.includes('nav =')) errors.push('training-route-write-free');
  if (!source.includes('__smokeRouteTrainingTo: routeTrainingForSmoke,')) {
    errors.push('training-route-api');
  }
  return errors;
}

function trainingSourceErrorSetupWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const body = sourceSection(
    source,
    '  /* Current Field Training snapshots have exactly one own key, `view`.',
    '\n  const currentSourceLabel =',
  );
  if (body.length === 0) return ['training-source-error-setup-section'];
  if (!body.includes('api.__smokeRouteTrainingTo(') || body.includes('api.landOn(')) {
    errors.push('training-source-error-write-free-route');
  }
  if (!body.includes("failSliceWithoutCascade('TRAINING SOURCE-ERROR SETUP:")) {
    errors.push('training-source-error-causal-stop');
  }
  return errors;
}

function atlasWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const body = sourceSection(
    source,
    'async function addToAtlas(): Promise<boolean> {',
    '\ncard.addEventListener',
  );
  if (body.length === 0) return ['atlas-source-section'];
  const claim = body.indexOf('const actionClaim = productActionCoordinator.tryClaim(operation);');
  const hold = body.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);', claim);
  const heartbeat = body.indexOf('await settleF4Heartbeat();', hold);
  const commit = body.indexOf('const attempt = await commitArc0AtlasAction({', heartbeat);
  const durable = body.indexOf('durable = true;', commit);
  const publish = body.indexOf('publishArc0AtlasFields(attempt.transaction.state, facts, surface);', durable);
  const identity = body.indexOf('worldIdentityState = attempt.verification.worldIdentity.state;', publish);
  const event = body.indexOf("gameEvent('atlas-add', { id: 'p' + p.seed });", identity);
  const settle = body.indexOf('actionClaim.settle(durable);', event);
  if (!(claim >= 0 && hold > claim && heartbeat > hold && commit > heartbeat
    && durable > commit && publish > durable && identity > publish
    && event > identity && settle > event)) errors.push('atlas-durable-order');
  if ((body.match(/commitArc0AtlasAction\(/gu) ?? []).length !== 1) {
    errors.push('atlas-single-writer');
  }
  if (body.includes('persistView(')
    || body.includes('save.logMap.push(')
    || body.includes('claimCanonicalWorldIdentity(')) {
    errors.push('atlas-no-optimistic-writer');
  }
  if (!body.includes('if (trainingCheckpointWriteHeld)')
    || !body.includes("lastArc0AtlasOutcome = 'training-write-held';")
    || !body.includes("lastArc0AtlasOutcome = 'training-route-only';")
    || !body.includes('replacementReloadPending || trainingCheckpointWriteHeld)')) {
    errors.push('atlas-training-route-only');
  }
  if (!body.includes("if (attempt.kind === 'already-durable')")
    || !body.includes('rebindArc0AtlasObservedRoute(attempt.observation, surface)')
    || !body.includes("lastArc0AtlasOutcome = 'already-durable-route-rebound';")
    || !body.includes("lastArc0AtlasOutcome = 'already-durable-route-reload';")
    || !body.includes("lastArc0AtlasOutcome = 'committed-publication-reload';")) {
    errors.push('atlas-idempotence-and-postcommit-convergence');
  }
  return errors;
}

function checkpointWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const body = sourceSection(
    source,
    'async function persistView(',
    '\nlet _persistT =',
  );
  if (body.length === 0) return ['checkpoint-source-section'];
  const parent = body.indexOf('const checkpointParent = runtime.checkpointParent();');
  const projection = body.indexOf('const projection = projectCheckpointState({', parent);
  const commit = body.indexOf('const outcome = await runtime.commit(candidate, Date.now());', projection);
  if (!(parent >= 0 && projection > parent && commit > projection)) {
    errors.push('checkpoint-durable-parent-order');
  }
  if (!body.includes('trainingReplacement: replacementOwner !== null,')
    || !body.includes("projection.kind !== 'projected'")) {
    errors.push('checkpoint-explicit-scope');
  }
  if (body.includes('...save')
    || body.includes('encodeWorldIdentityExtensionWrites(worldIdentityState)')) {
    errors.push('checkpoint-no-live-product-overlay');
  }
  return errors;
}

describe('Arc 0 main landing wiring', () => {
  const main = readFileSync(MAIN_URL, 'utf8');

  it('publishes only one verified durable landing action and never checkpoints it twice', () => {
    expect(landingWiringErrors(main)).toEqual([]);
    expect(trainingRouteWiringErrors(main)).toEqual([]);
    expect(main).toContain('async function surveyAndLand(p: PlanetNode, star: ProvenStar): Promise<boolean>');
    expect(main).toContain("card.addEventListener('click', async (e) => {");
    expect(main).toContain('const landed = await doLand();');
    expect(main).toContain('landOn: async (selector: unknown) => {');
    expect(main).toContain('__smokeRejectNextArc0LandingStorage: () => {');
    expect(main).toContain('__smokeStaleNextArc0LandingAuthority: () => {');
    expect(main).toContain('__smokeRejectNextArc0LandingPublication: () => {');
  });

  it('turns red if the receipt writer or postcommit publisher is removed', () => {
    expect(landingWiringErrors(main.replace(
      'attempt = await commitArc0LandingAction({',
      'attempt = await Promise.resolve(null as never); // mutation control',
    ))).toContain('landing-durable-order');
    expect(landingWiringErrors(main.replace(
      'publishArc0LandingFields(attempt.transaction.state, facts);',
      '// mutation control removed publication',
    ))).toContain('landing-durable-order');
    expect(landingWiringErrors(main.replace(
      'refreshPlanetSurveyCard();\n      if ((facts.permanentLanding',
      'refreshPlanetSurveyCard(); void persistView();\n      if ((facts.permanentLanding',
    ))).toContain('landing-no-optimistic-writer');
    expect(landingWiringErrors(main.replace(
      "if (__CF_EVIDENCE_BUILD__ && smokeRejectNextArc0LandingPublication) {",
      'if (false) { // mutation control removed publication failure',
    ))).toContain('landing-postcommit-convergence');
    expect(landingWiringErrors(main.replace(
      "lastArc0LandingOutcome = 'training-write-held';",
      "lastArc0LandingOutcome = 'training-route-only'; // mutation control",
    ))).toContain('landing-training-route-only');
    expect(landingWiringErrors(main.replace(
      '    save.chacc = committed.chacc.slice();',
      '    // mutation control omitted accepted Starter Charters',
    ))).toContain('landing-starter-charter-publication');
    expect(landingWiringErrors(main.replace(
      '        const loaded = readArc2Loot(runtime.extensions);',
      '        const loaded = { kind: \'absent\' } as const; // mutation control omitted exact gear carrier',
    ))).toContain('landing-durable-order');
    expect(landingWiringErrors(main.replace(
      "      if (facts.descent.kind === 'landed') {",
      '      if (false) { // mutation control skipped exact Arc 2 fixed point',
    ))).toContain('landing-exact-arc2-fixed-point');
    expect(landingWiringErrors(main.replace(
      '    save.hp = committed.hp;',
      '    save.hp = committed.hp; save.savedView = committed.savedView; // mutation control',
    ))).toContain('landing-wave-off-publication-fence');
    expect(landingWiringErrors(main.replace(
      '        ...facts.starterCharters.addedAchievementIds,',
      '        // mutation control omitted Starter Charter achievements',
    ))).toContain('landing-combined-progression-facts');
    expect(landingWiringErrors(main.replace(
      'JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)',
      'false /* mutation control trusts an unrelated checkpoint */',
    ))).toContain('landing-runtime-checkpoint-proof');
    expect(trainingRouteWiringErrors(main.replace(
      "  if (!trainingCheckpointWriteHeld || !trainingActive() || nav.mode !== 'system'",
      "  if (trainingCheckpointWriteHeld || !trainingActive() || nav.mode !== 'system' /* mutation control */",
    ))).toContain('training-route-proof-order');
    expect(trainingRouteWiringErrors(main.replace(
      '!p || !presentPlanetSurvey(p, nav.star)',
      '!p || !surveyPlanet(p, nav.star) /* mutation control */',
    ))).toContain('training-route-write-free');
  });

  it('publishes Atlas only after its one verified durable transaction', () => {
    expect(atlasWiringErrors(main)).toEqual([]);
    expect(main).toContain('const charted = await addToAtlas();');
    expect(main).toContain('atlasRouteStates = nextRoutes;');
  });

  it('turns red if Atlas bypasses its receipt writer or publishes optimistically', () => {
    expect(atlasWiringErrors(main.replace(
      'const attempt = await commitArc0AtlasAction({',
      'const attempt = await Promise.resolve(null as never); // mutation control',
    ))).toContain('atlas-durable-order');
    expect(atlasWiringErrors(main.replace(
      'publishArc0AtlasFields(attempt.transaction.state, facts, surface);',
      '// mutation control removed Atlas publication',
    ))).toContain('atlas-durable-order');
    expect(atlasWiringErrors(main.replace(
      "gameEvent('atlas-add', { id: 'p' + p.seed });\n      refreshPlanetSurveyCard();\n      if (openPanelId() === 'atlas')",
      "gameEvent('atlas-add', { id: 'p' + p.seed }); void persistView();\n      refreshPlanetSurveyCard();\n      if (openPanelId() === 'atlas')",
    ))).toContain('atlas-no-optimistic-writer');
    expect(atlasWiringErrors(main.replace(
      'rebindArc0AtlasObservedRoute(attempt.observation, surface)',
      'true // mutation control skipped sidecar rebind',
    ))).toContain('atlas-idempotence-and-postcommit-convergence');
    expect(atlasWiringErrors(main.replace(
      "lastArc0AtlasOutcome = 'training-write-held';",
      "lastArc0AtlasOutcome = 'training-route-only'; // mutation control",
    ))).toContain('atlas-training-route-only');
  });

  it('builds every receipt-free checkpoint from the exact durable parent', () => {
    expect(checkpointWiringErrors(main)).toEqual([]);
    expect(main).toContain('initialState: save,');
  });

  it('turns red if checkpoint persistence can spread live product state', () => {
    expect(checkpointWiringErrors(main.replace(
      'const projection = projectCheckpointState({',
      'const projection = { kind: \'projected\', state: { ...save } } as const; // mutation control\n      void ({',
    ))).toContain('checkpoint-no-live-product-overlay');
  });

  it('awaits asynchronous diagnostic landings before reading their outcome', () => {
    const smoke = readFileSync(SMOKE_URL, 'utf8');
    expect(trainingSourceErrorSetupWiringErrors(smoke)).toEqual([]);
    expect(smoke).toContain('landed:await api.landOn(${selectorSource})');
    expect(smoke).toContain('accepted=await S.api.landOn({seed:${ARC4_PERTAR_FIXTURE.planet.seed}');
    expect(smoke).toContain('accepted=await S.api.landOn(${JSON.stringify(ARC4_PERTAR_FIXTURE.planet)})');
    expect(smoke).toContain('await S.api.landHere();');
    expect(trainingSourceErrorSetupWiringErrors(smoke.replace(
      'api.__smokeRouteTrainingTo(',
      'api.landOn(',
    ))).toContain('training-source-error-write-free-route');
    expect(trainingSourceErrorSetupWiringErrors(smoke.replace(
      "failSliceWithoutCascade('TRAINING SOURCE-ERROR SETUP:",
      "fails.push('TRAINING SOURCE-ERROR SETUP:",
    ))).toContain('training-source-error-causal-stop');
  });
});
