import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'main.ts'),
  'utf8',
);

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function section(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  return from >= 0 && to > from ? source.slice(from, to) : '';
}

function replaceUnique(source: string, needle: string, replacement: string): string {
  if (occurrences(source, needle) !== 1) {
    throw new Error(`world-identity mutation anchor is not unique: ${needle}`);
  }
  return source.replace(needle, replacement);
}

function assess(source: string): string[] {
  const failures: string[] = [];
  const show = section(source, 'function showSurvey(', '\nfunction hideSurvey(');
  const present = section(source, 'function presentPlanetSurvey(', '\nfunction surveyPlanet(');
  const actions = section(source, 'function buildCardActions(', '\nfunction refreshPlanetSurveyCard(');
  const share = section(source, 'function cardShareCode(', '\nasync function copyShareCode(');
  const land = section(source, 'async function doLand(', '\nlet lastArc0AtlasOutcome:');
  const atlas = section(source, 'async function addToAtlas(', "\ncard.addEventListener('click'");
  const persist = section(source, 'async function persistView(', '\nlet _persistT');
  const search = section(source, '/* ---- THE SEARCH BAR', "\nsheet.querySelector('#importclose')");
  const searchName = section(
    search,
    'async function commitArc0WorldNameForSearch(',
    '\nfunction publishAcceptedSearchNavigation(',
  );
  const searchPublication = section(
    source,
    'function publishAcceptedSearchNavigation(',
    '\nfunction galaxyNavForAcceptedSearchRoute(',
  );
  const searchCommit = section(search, '  commitNavigation:', '\n  onPrimeReachBlocked:');
  const boot = section(source, 'async function loadSave()', '\n  await loadSave();');

  const requirements: readonly (readonly [string, string, string])[] = [
    ['search-name-read', search, 'currentPlanetName: (address) => worldIdentityName(worldIdentityState, address),'],
    ['search-name-write', searchName, 'const attempt = await commitArc0WorldNameAction({'],
    ['search-name-coordinator', searchName, 'productActionCoordinator.tryClaim(operation)'],
    ['search-name-heartbeat', searchName, 'await settleF4Heartbeat();'],
    ['search-name-training-fence', searchName, '|| trainingCheckpointWriteHeld'],
    ['search-name-legacy-publication', searchName, 'save.customNames = attempt.transaction.state.customNames.map('],
    ['search-name-identity-publication', searchName, 'worldIdentityState = attempt.verification.worldIdentity.state;'],
    ['search-name-checkpoint', searchPublication, 'rerender(skipPersist ? { skipPersist: true } : undefined);'],
    ['survey-name-read', present, 'const customName = worldIdentityName(worldIdentityState, address);'],
    ['rarity-land-read', show, 'hasCanonicalWorldLanded(worldIdentityState, shownWorld)'],
    ['atlas-route-join', actions, 'atlasEntryForWorld(address) !== null'],
    ['share-name-read', share, 'worldIdentityName(worldIdentityState, address) ?? undefined'],
    ['landing-authority', land, 'attempt = await commitArc0LandingAction({'],
    ['landing-durable-fence', land, 'durable = true;'],
    ['landing-identity-publication', land, 'worldIdentityState = attempt.verification.worldIdentity.state;'],
    ['atlas-authority', atlas, 'const attempt = await commitArc0AtlasAction({'],
    ['atlas-durable-fence', atlas, 'durable = true;'],
    ['atlas-identity-publication', atlas, 'worldIdentityState = attempt.verification.worldIdentity.state;'],
    ['checkpoint-parent', persist, 'const checkpointParent = runtime.checkpointParent();'],
    ['checkpoint-projector', persist, 'const projection = projectCheckpointState({'],
    ['checkpoint-commit', persist, 'const outcome = await runtime.commit(candidate, Date.now());'],
    ['boot-carrier', boot, 'const prepared = prepareWorldIdentityBootstrap({'],
    ['boot-full-addresses', boot, 'addresses: knownWorlds,'],
    ['boot-extension-join', boot, 'initialExtensions = prepared.extensions;'],
    ['boot-atlas-id-proof', boot, 'atlasRouteIdentityMatches(id, route.state)'],
  ];
  for (const [id, owner, needle] of requirements) {
    if (owner.length === 0 || !owner.includes(needle)) failures.push(id);
  }
  const nameAction = searchName.indexOf('const attempt = await commitArc0WorldNameAction({');
  const nameDurable = searchName.indexOf('durable = true;', nameAction);
  const compatibilityPublication = searchName.indexOf(
    'save.customNames = attempt.transaction.state.customNames.map(',
    nameDurable,
  );
  const namePublication = searchName.indexOf(
    'worldIdentityState = attempt.verification.worldIdentity.state;',
    compatibilityPublication,
  );
  const nameSettle = searchName.indexOf('actionClaim.settle(durable);', namePublication);
  if (!(nameAction >= 0 && nameDurable > nameAction
    && compatibilityPublication > nameDurable && namePublication > compatibilityPublication
    && nameSettle > namePublication)
    || searchName.includes('persistView(')
    || searchName.includes('setCanonicalWorldName(')) {
    failures.push('search-name-transaction-order');
  }
  const namedCommit = searchCommit.indexOf('const naming = await commitArc0WorldNameForSearch(');
  const acceptedRoute = searchCommit.indexOf('return commitArc9AcceptedSearchRoute(plan);', namedCommit);
  const navPublication = searchPublication.indexOf('nav = committedNav;');
  const render = searchPublication.indexOf(
    'rerender(skipPersist ? { skipPersist: true } : undefined);',
    navPublication,
  );
  if (namedCommit < 0 || acceptedRoute <= namedCommit || navPublication < 0 || render <= navPublication
    || searchPublication.includes('void persistView()')
    || searchPublication.includes('rerender();')) {
    failures.push('search-name-checkpoint');
  }
  if (persist.includes('...save')
    || persist.includes('encodeWorldIdentityExtensionWrites(worldIdentityState)')) {
    failures.push('checkpoint-no-live-world-identity');
  }
  if (land.includes('recordCanonicalWorldLanding(') || land.includes('persistView(')) {
    failures.push('landing-no-optimistic-authority');
  }
  if (atlas.includes('claimCanonicalWorldIdentity(')
    || atlas.includes('save.logMap.push(') || atlas.includes('persistView(')) {
    failures.push('atlas-no-optimistic-authority');
  }

  if (!source.includes('landedWorlds: canonicalWorldLandingCount(worldIdentityState),')
    || !source.includes("['worlds landed', canonicalWorldLandingCount(worldIdentityState)]")) {
    failures.push('count-authority');
  }
  if (!source.includes('resolveCF1WorldAtlasId(id)')
    || !source.includes('idAddress.address.key === routeAddress.key')) {
    failures.push('atlas-id-route-equality');
  }

  /* These exact seed-only reads used to decide current identity. The two
     remaining v4 writes are deliberately allowed compatibility mirrors. */
  for (const forbidden of [
    'const firstLand = !save.landed.includes',
    "save.logMap.some(([id]) => id === 'p' +",
    "customNames.get('p' + cardCtx",
    "const customName = customNames.get('p' + p.seed)",
    "currentPlanetName: (planetSeed) => customNames.get('p' + planetSeed)",
  ]) if (source.includes(forbidden)) failures.push('seed-only-current-authority');
  if (occurrences(source, 'save.landed = committed.landed.slice();') !== 1
    || occurrences(searchName, 'save.customNames = attempt.transaction.state.customNames.map(') !== 1) {
    failures.push('v4-mirror-cardinality');
  }
  return [...new Set(failures)];
}

describe('canonical world identity — Main composition contract', () => {
  it('uses complete source-proven identity for every current product path', () => {
    expect(assess(mainSource)).toEqual([]);
  });

  it('negative-controls every name, land, Atlas, share, checkpoint, and boot owner', () => {
    for (const [needle, expected] of [
      ['currentPlanetName: (address) => worldIdentityName(worldIdentityState, address),', 'search-name-read'],
      ['const attempt = await commitArc0WorldNameAction({', 'search-name-write'],
      ['hasCanonicalWorldLanded(worldIdentityState, shownWorld)', 'rarity-land-read'],
      ['attempt = await commitArc0LandingAction({', 'landing-authority'],
      ['const attempt = await commitArc0AtlasAction({', 'atlas-authority'],
      ['worldIdentityName(worldIdentityState, address) ?? undefined', 'share-name-read'],
      ['const projection = projectCheckpointState({', 'checkpoint-projector'],
      ['const prepared = prepareWorldIdentityBootstrap({', 'boot-carrier'],
    ] as const) {
      const mutated = replaceUnique(mainSource, needle, `/* removed ${expected} */`);
      expect(assess(mutated), expected).toContain(expected);
    }
    const boot = section(mainSource, 'async function loadSave()', '\n  await loadSave();');
    const withoutBootAtlasProof = replaceUnique(
      boot,
      'atlasRouteIdentityMatches(id, route.state)',
      'true /* removed boot-atlas-id-proof */',
    );
    expect(assess(replaceUnique(mainSource, boot, withoutBootAtlasProof)))
      .toContain('boot-atlas-id-proof');
    const publication = section(
      mainSource,
      'function publishAcceptedSearchNavigation(',
      '\nfunction galaxyNavForAcceptedSearchRoute(',
    );
    const skipped = replaceUnique(
      publication,
      '  rerender(skipPersist ? { skipPersist: true } : undefined);',
      '  rerender();',
    );
    expect(assess(replaceUnique(mainSource, publication, skipped)))
      .toContain('search-name-checkpoint');
  });

  it('negative-controls reintroduction of leaf-seed landing and naming authority', () => {
    const land = section(mainSource, 'async function doLand(', '\nlet lastArc0AtlasOutcome:');
    const injectedLand = replaceUnique(
      mainSource,
      land,
      land.replace(
        '  const operation = operationForArc0Landing(address);',
        '  const firstLand = !save.landed.includes(p.seed);\n' +
        '  const operation = operationForArc0Landing(address);',
      ),
    );
    expect(assess(injectedLand)).toContain('seed-only-current-authority');

    const injectedName = mainSource.replace(
      '  const customName = worldIdentityName(worldIdentityState, address);',
      "  const customName = customNames.get('p' + p.seed);",
    );
    expect(assess(injectedName)).toContain('seed-only-current-authority');
    expect(assess(injectedName)).toContain('survey-name-read');
  });
});
