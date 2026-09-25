/* D16 parity — Prime Codex slot travel (v1 `data-pgo`) and Titan tracking (v1 `data-tgo`) — INVENTORY rows #88/#89.
 *
 * The exact shipped Main sections run type-stripped: `fillPrimeCodex` (the real projection + renderer into #primepanel), the
 * #primepanel click listener and `runPrimeCodexTravel`. The press goes to the one proven-route owner (`searchTravel`), recorded
 * here, so the OUTCOME asserted is the exact world the explorer is flown to:
 * - a claim written by the real combat settlement projection (`projectLegacyGuardianWorldWhereV1`) survives the save codec
 *   (export → import) and flies back to that exact world;
 * - tracking flies to a world that independently hosts a present Titan of that element (placement facts + the world's type),
 *   deterministically (the same world every time), and only when the resonance is in reach. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { PRIME_SIGNATURES_V1, projectTitanPlacementFactsV1 } from '@cf/domain-combatcore';
import { systemFor } from '@cf/domain-worldgen';
import { exportSaveV2, importSaveV2, projectLegacyGuardianWorldWhereV1, type ContentRegistry, type SaveStateV2 } from '@cf/persistence';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import { projectPrimeCodexV1, renderPrimeCodexPanelV1 } from '../apps/game/src/prime-codex-panel.js';
import { nearestTitanWorldV1, primeClaimWorldAddressV1, trackablePrimeSignaturesV1 } from '../apps/game/src/prime-travel.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };

function section(start: string, end: string): string {
  if (MAIN.split(start).length !== 2) throw new Error(`anchor must be unique: ${start}`);
  const left = MAIN.indexOf(start), right = MAIN.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`section missing: ${start}`);
  return MAIN.slice(left, right);
}
const SECTIONS = (): string => [
  section('function fillPrimeCodex(): void {', '\n/* THE STAR ATLAS'),
  section("document.getElementById('primepanel')!.addEventListener('click', (event) => {", '\nconst combatChroniclePanel'),
  section('async function runPrimeCodexTravel(', '\n/** The Fabricator'),
].join('\n');

let MARS: ReturnType<typeof resolveCF1WorldAddress> = { ok: false, reason: 'not-yet' } as ReturnType<typeof resolveCF1WorldAddress>;
beforeAll(() => {
  installCaptureHooks();
  MARS = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 134 } });
});

function saveWithClaim(): SaveStateV2 {
  if (!MARS.ok) throw new Error(MARS.reason);
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const save = imported.state;
  save.primeFill.stone = { title: 'Terrakoth', sub: 'Earth Titan', tier: 4, hex: '#b08a5a', where: projectLegacyGuardianWorldWhereV1(MARS.address) };
  // the durable round trip: the claim's world must survive the save codec it is stored through
  const reloaded = importSaveV2(exportSaveV2(save, NOW), REGISTRY, NOW);
  if (!reloaded.ok) throw new Error(reloaded.reason);
  return reloaded.state;
}

function mount(save: SaveStateV2, stage: number, sections = SECTIONS()) {
  const dom = new JSDOM('<!doctype html><html><body><aside id="primepanel"></aside></body></html>');
  const doc = dom.window.document;
  const jumps: CanonicalCF1WorldAddress[] = [];
  const env: Record<string, unknown> = {
    document: doc, Element: dom.window.Element, save, PRIME_SIGNATURES_V1,
    fillPanel: (id: string, html: string) => { if (id === 'prime') doc.getElementById('primepanel')!.innerHTML = html; },
    projectPrimeCodexV1, renderPrimeCodexPanelV1, primeClaimWorldAddressV1, trackablePrimeSignaturesV1, nearestTitanWorldV1,
    smokeForceReadOnly: false, f4RuntimeMayMutate: () => true, activePersist: null, importWriteInFlight: false,
    replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false, trainingActive: () => false,
    ecologyEpochBlocksActions: () => false, arc9FrontierEndingPending: false, frontierEndingPanelStatus: () => null,
    ascStage: () => stage, runArc9FrontierEndingChoice: vi.fn(), closePanels: vi.fn(), toast: vi.fn(),
    searchTravel: { jumpToCanonicalAddress: vi.fn(async (address: CanonicalCF1WorldAddress) => { jumps.push(address); return true; }) },
  };
  const out = transformSync('main-d16-prime.ts', sections);
  if (out.errors.length) throw new Error(JSON.stringify(out.errors));
  new Function('env', `with (env) { ${out.code}; fillPrimeCodex(); }`)(env);
  return { dom, doc, env, jumps };
}
const settle = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0)); };

describe('D16 Prime Codex travel + Titan tracking', () => {
  it('a claimed Signature flies back to the exact world it was won on, after the save codec round trip', async () => {
    if (!MARS.ok) throw new Error('fixture');
    const view = mount(saveWithClaim(), 3);
    const button = view.doc.querySelector<HTMLButtonElement>('[data-prime-travel="stone"]');
    expect(button?.textContent).toBe('Travel there ↗');
    button!.click();
    await settle();
    expect(view.jumps.map((a) => a.key)).toEqual([MARS.address.key]);
    expect(view.env.closePanels).toHaveBeenCalledTimes(1);
    view.dom.window.close();
  });

  it('an in-reach Titan is tracked to a world that independently hosts it, the same world every time', async () => {
    const view = mount(saveWithClaim(), 3);
    const track = view.doc.querySelector<HTMLButtonElement>('[data-prime-track="flame"]');
    expect(track?.textContent).toBe('📡 Track the Titan ↗');
    track!.click();
    await settle();
    expect(view.jumps).toHaveLength(1);
    const world = view.jumps[0]!;
    const planet = systemFor(world.star.seed).planets.find((p) => Number(p.P.seed) === world.planet.seed)!;
    const fact = projectTitanPlacementFactsV1({ planetSeed: world.planet.seed, worldType: String(planet.P.type), regionIndex: 0, claimedSignatureIds: ['stone'] })
      .find((f) => f.signatureId === 'flame')!;
    expect(fact.present).toBe(true);
    expect(world.galaxy.seed).toBe(999); // Flame's Titan is a home-galaxy hunt (minimum region 0)
    expect(view.env.toast).toHaveBeenLastCalledWith('📡 Tracking Fire Titan', expect.stringContaining('bearing set for'), true);
    // determinism: the same scan finds the same world
    expect(nearestTitanWorldV1('flame', { ascentStage: 3, claimedIds: ['stone'] })?.key).toBe(world.key);
    view.dom.window.close();
  });

  it('out of reach (before the Ascent opens the galaxy, or a far element) there is no Track button; claimed rows never offer Track', () => {
    const early = mount(saveWithClaim(), 2);
    expect(early.doc.querySelectorAll('[data-prime-track]')).toHaveLength(0);
    expect(early.doc.querySelector('[data-prime-travel="stone"]')).not.toBeNull();
    const late = mount(saveWithClaim(), 3);
    expect(late.doc.querySelector('[data-prime-track="void"]')).toBeNull(); // Void resonates from region 2
    expect(late.doc.querySelector('[data-prime-track="stone"]')).toBeNull(); // claimed
    expect(trackablePrimeSignaturesV1({ ascentStage: 3, claimedIds: ['stone'] }).has('flame')).toBe(true);
    early.dom.window.close(); late.dom.window.close();
  });

  it('a malformed or missing saved world offers no travel', () => {
    expect(primeClaimWorldAddressV1(null)).toBeNull();
    expect(primeClaimWorldAddressV1({ type: 'star' })).toBeNull();
    expect(primeClaimWorldAddressV1({ type: 'planet', gal: { seed: 999, x: 90, y: -60 }, star: { seed: 1, x: 0, y: 0 }, pseed: 5 })).toBeNull();
  });

  it('negative control: a panel that never passes the travel set renders no Travel button', () => {
    const mutated = SECTIONS().replace("    travel: new Set(claimedIds.filter((id) => primeClaimWorldAddressV1(save.primeFill[id]?.where) !== null)),\n", '');
    expect(mutated).not.toBe(SECTIONS());
    const view = mount(saveWithClaim(), 3, mutated);
    expect(view.doc.querySelector('[data-prime-travel]')).toBeNull();
    view.dom.window.close();
  });

  it('negative control: a listener that ignores the travel buttons flies nowhere', async () => {
    const needle = '  if (travel !== null) { void runPrimeCodexTravel(travel); return; }\n';
    expect(SECTIONS().split(needle)).toHaveLength(2);
    const view = mount(saveWithClaim(), 3, SECTIONS().replace(needle, ''));
    view.doc.querySelector<HTMLButtonElement>('[data-prime-travel="stone"]')!.click();
    await settle();
    expect(view.jumps).toHaveLength(0);
    view.dom.window.close();
  });
});
