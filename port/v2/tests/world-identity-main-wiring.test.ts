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
  const land = section(source, 'function doLand(', '\nfunction addToAtlas(');
  const atlas = section(source, 'function addToAtlas(', "\ncard.addEventListener('click'");
  const persist = section(source, 'async function persistView(', '\nlet _persistT');
  const search = section(source, 'const searchTravel = createSearchTravelController({', "\nsheet.querySelector('#importclose')");
  const searchCommit = section(search, '  commitNavigation:', '\n  onPrimeReachBlocked:');
  const boot = section(source, 'async function loadSave()', '\n  await loadSave();');

  const requirements: readonly (readonly [string, string, string])[] = [
    ['search-name-read', search, 'currentPlanetName: (address) => worldIdentityName(worldIdentityState, address),'],
    ['search-name-write', search, 'const naming = setCanonicalWorldName('],
    ['search-capacity-refusal', search, 'if (naming.capacityProtected) {'],
    ['search-capacity-base', search, 'f4Runtime?.extensions ?? EMPTY_V5_EXTENSIONS,'],
    ['search-name-checkpoint', searchCommit, 'rerender();'],
    ['survey-name-read', present, 'const customName = worldIdentityName(worldIdentityState, address);'],
    ['rarity-land-read', show, 'hasCanonicalWorldLanded(worldIdentityState, shownWorld)'],
    ['atlas-route-join', actions, 'atlasEntryForWorld(address) !== null'],
    ['share-name-read', share, 'worldIdentityName(worldIdentityState, address) ?? undefined'],
    ['landing-authority', land, 'const landing = recordCanonicalWorldLanding('],
    ['landing-capacity-refusal', land, 'if (landing.capacityProtected) {'],
    ['landing-outcome', land, 'const firstLand = landing.firstLanding;'],
    ['atlas-composite-id', atlas, 'const id = canonicalCF1WorldAtlasId(address);'],
    ['atlas-composite-dedupe', atlas, 'if (atlasEntryForWorld(address) === null)'],
    ['atlas-legacy-claim', atlas, 'const identityClaim = claimCanonicalWorldIdentity('],
    ['atlas-capacity-refusal', atlas, 'if (identityClaim.capacityProtected) {'],
    ['checkpoint-carrier', persist, 'encodeWorldIdentityExtensionWrites(worldIdentityState)'],
    ['boot-carrier', boot, 'const prepared = prepareWorldIdentityBootstrap({'],
    ['boot-full-addresses', boot, 'addresses: knownWorlds,'],
    ['boot-extension-join', boot, 'initialExtensions = prepared.extensions;'],
    ['boot-atlas-id-proof', boot, 'atlasRouteIdentityMatches(id, route.state)'],
  ];
  for (const [id, owner, needle] of requirements) {
    if (owner.length === 0 || !owner.includes(needle)) failures.push(id);
  }
  const namePublication = searchCommit.indexOf('worldIdentityState = naming.state;');
  const compatibilityPublication = searchCommit.indexOf('save.customNames = [...customNames.entries()];');
  const checkpoint = searchCommit.indexOf('rerender();');
  if (namePublication < 0 || compatibilityPublication <= namePublication || checkpoint <= compatibilityPublication
    || searchCommit.includes('rerender({ skipPersist: true })')
    || searchCommit.includes('void persistView()')) {
    failures.push('search-name-checkpoint');
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
  if (occurrences(land, 'save.landed.includes(p.seed)') !== 1
    || occurrences(search, "customNames.set('p' + focusPlanet.seed, customPlanetName);") !== 1) {
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
      ['const naming = setCanonicalWorldName(', 'search-name-write'],
      ['hasCanonicalWorldLanded(worldIdentityState, shownWorld)', 'rarity-land-read'],
      ['const landing = recordCanonicalWorldLanding(', 'landing-authority'],
      ['const id = canonicalCF1WorldAtlasId(address);', 'atlas-composite-id'],
      ['worldIdentityName(worldIdentityState, address) ?? undefined', 'share-name-read'],
      ['encodeWorldIdentityExtensionWrites(worldIdentityState)', 'checkpoint-carrier'],
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
    const search = section(mainSource, 'const searchTravel = createSearchTravelController({', "\nsheet.querySelector('#importclose')");
    const commit = section(search, '  commitNavigation:', '\n  onPrimeReachBlocked:');
    const skipped = replaceUnique(commit, '    rerender();', '    rerender({ skipPersist: true });');
    expect(assess(replaceUnique(mainSource, commit, skipped))).toContain('search-name-checkpoint');
  });

  it('negative-controls reintroduction of leaf-seed landing and naming authority', () => {
    const land = section(mainSource, 'function doLand(', '\nfunction addToAtlas(');
    const injectedLand = replaceUnique(
      mainSource,
      land,
      land.replace(
        '  const landing = recordCanonicalWorldLanding(',
        '    const firstLand = !save.landed.includes(p.seed);\n' +
        '  const landing = recordCanonicalWorldLanding(',
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
