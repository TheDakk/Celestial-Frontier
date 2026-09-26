/** D14 Outposts P4 — the world card's "Build here" section and the Projects board as a browser-free UI OUTCOME: the exact shipped Main
 * Outposts section runs over a real F4 runtime + memory backend in JSDOM, the real buttons are pressed, the committed save is read back
 * from storage and after a reboot, and the live save equals it. Mutation controls break the WIRING (the click listener, the publication,
 * the card hook), never the assertion. */
import { createRequire } from 'node:module';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  outpostSaveFactsV1, prepareArc2LootLegacyMigration, projectArc2LootLegacyMirror, projectOutpostBoardV1, projectOutpostWorldOfferV1,
  readArc2Loot, readOutpostProjectsV1, readSaveV5, type SaveStateV2, type V5Extensions,
} from '@cf/persistence';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { prepareArc3AppBootstrap } from '../apps/game/src/arc3-engineering-actions.js';
import { commitOutpostActionV1, outpostRefusalCopyV1, outpostResultCopyV1 } from '../apps/game/src/outposts-action.js';
import { OutpostsControllerV1, outpostPortraitMarksV1, renderOutpostBoardV1, renderOutpostCardSectionV1 } from '../apps/game/src/outposts-ui.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';
import { MAIN_SOURCE, NOW, REGISTRY, boot, fixtureSave, marsSurface, reboot, section, until } from '../test-support/d16-engineering-harness.js';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };
const START = '/* D14 Outposts (N4 Option A;', END = '\nconst sideEl = ';
const mars = () => resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 134 } });

function fixture(): { save: SaveStateV2; extensions: V5Extensions } {
  const save = fixtureSave(0);
  save.chDone = ['st-comp']; save.techOwned = ['scan1']; save.landed = [134]; save.stats = { ...save.stats, landings: 1 }; save.essence = 40;
  const loot = prepareArc2LootLegacyMigration({ extensions: {}, legacy: { items: [['frame', 3], ['plate', 2]], equip: {}, equipAff: {} }, capacity: 32 });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const read = readArc2Loot(loot.extensions); if (read.kind !== 'loaded') throw new Error(read.kind);
  save.items = projectArc2LootLegacyMirror(read.state).items.map(([id, n]) => [id, n] as [string, number]);
  const engineering = prepareArc3AppBootstrap({ extensions: loot.extensions, save, sources: Object.freeze({ current: marsSurface(), saved: null, atlas: Object.freeze([]) }) });
  if (engineering.kind !== 'prepared') throw new Error(engineering.kind);
  return { save, extensions: engineering.extensions };
}

async function mountMain(mutate: (source: string) => string = (s) => s) {
  const MARS = mars(); if (!MARS.ok) throw new Error('address');
  const { save, extensions } = fixture();
  const booted = await boot(save, extensions);
  const dom = new JSDOM('<!doctype html><html><body><div id="card"></div><div id="board"></div></body></html>');
  const doc = dom.window.document, card = doc.getElementById('card')!, board = doc.getElementById('board')!;
  const p = { seed: 134, name: 'Mars', ordinal: 3 };
  const env: Record<string, unknown> = {
    document: doc, performance, Date, f4Runtime: booted.runtime, save, nav: { mode: 'surface', planet: { seed: 134 } }, cardCtx: { p },
    activeCardWorldAddress: () => MARS.address, canonicalRosterForBioscanCard: () => null, systemScene, worldIdentityName: () => null, worldIdentityState: null,
    arc5OwnershipState: null, readOutpostProjectsV1, outpostSaveFactsV1, projectOutpostWorldOfferV1, projectOutpostBoardV1, renderOutpostCardSectionV1,
    renderOutpostBoardV1, outpostPortraitMarksV1, OutpostsControllerV1, commitOutpostActionV1, outpostRefusalCopyV1, outpostResultCopyV1, readArc2Loot,
    f4RuntimeMayMutate: (runtime: unknown) => runtime === env.f4Runtime, activePersist: null, importWriteInFlight: false, replacementTransaction: null,
    replacementReloadPending: false, trainingCheckpointWriteHeld: false, productActionCoordinator: createProductActionCoordinator(), productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(), settleF4Heartbeat: async () => undefined, scheduleF4AuthorityConvergenceReload: vi.fn(),
    f4LastCheckpointAt: 0, arc2LootState: null, lastPersistenceOutcome: null, updateChips: vi.fn(), queueArc9ProgressionRefresh: vi.fn(), toast: vi.fn(),
    openPanelId: () => 'ch', refreshPlanetSurveyCard: () => { card.innerHTML = main.card(); }, fillCharters: () => { board.innerHTML = main.board(); },
  };
  const transformed = transformSync('main-outposts.ts', mutate(section(START, END)));
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  const main = new Function('env', `with (env) { ${transformed.code}; return {
    card: () => outpostCardActionHtml(cardCtx.p, true), board: () => outpostBoardHtml(), outcome: () => lastOutpostOutcome }; }`)(env) as {
    card: () => string; board: () => string; outcome: () => string | null };
  card.innerHTML = main.card(); board.innerHTML = main.board();
  const press = async (selector: string) => {
    const before = main.outcome(); const el = doc.querySelector<HTMLButtonElement>(selector);
    if (!el) throw new Error(`no control ${selector}`);
    el.dispatchEvent(new (dom.window as unknown as { MouseEvent: typeof MouseEvent }).MouseEvent('click', { bubbles: true }));
    await until(() => main.outcome() !== before && env.productActionInFlight === false, 400).catch(() => undefined);
  };
  return { booted, env, save, doc, card, board, main, press };
}
const durableProjects = async (backend: Parameters<typeof readSaveV5>[0]) => {
  const loaded = await readSaveV5(backend, REGISTRY, NOW); if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
  const read = readOutpostProjectsV1(loaded.extensions); if (read.kind !== 'loaded') throw new Error(read.kind);
  return { state: loaded.state, projects: read.state };
};

beforeAll(() => installCaptureHooks());
describe('outposts UI outcome (P4)', () => {
  it('the world card offers "Build Survey Relay here"; pressing it and then "Build stage 1" commits both, durably, the live save equals storage, and a reboot keeps it', async () => {
    const m = await mountMain();
    expect(m.card.querySelector('[data-outpost-start="relay"]')).not.toBeNull();
    expect(m.card.querySelector('[data-outpost-start="sanctuary"]')).toBeNull(); // not conquered: not offered
    await m.press('[data-outpost-start="relay"]');
    expect(m.main.outcome()).toBe('committed:start');
    let d = await durableProjects(m.booted.backend);
    expect(d.projects.sites.map((s) => [s.id, s.built])).toEqual([['relay@134', 0]]);
    // the site records its REAL system (found 2026-09-26: raw systemFor planets carry no `seed`, which would record [0, …, 134])
    expect(d.projects.sites[0]!.world.systemPlanetSeeds.length).toBeGreaterThan(3);
    expect(d.projects.sites[0]!.world.systemPlanetSeeds.every((seed) => seed > 0)).toBe(true);
    await m.press('[data-outpost-build="relay@134"]');
    expect(m.main.outcome()).toBe('committed:build');
    d = await durableProjects(m.booted.backend);
    expect(d.projects.sites[0]!.built).toBe(1);
    expect(d.state.items).toEqual([['frame', 1]]);            // 2 frames + 2 plates spent
    expect(m.save.items).toEqual(d.state.items);             // published: the live save equals storage
    expect(m.board.querySelector('[data-outpost-site="relay@134"]')?.getAttribute('data-outpost-status')).toBe('building');
    expect(m.card.querySelector('[data-outpost-deed="open"]')?.textContent).toMatch(/Land on 2 other worlds/);
    const rebooted = await reboot(m.booted);
    expect(readOutpostProjectsV1(rebooted.booted.runtime.extensions)).toMatchObject({ kind: 'loaded', present: true });
    expect(rebooted.state.items).toEqual([['frame', 1]]);
  }, 120_000);
  it('abandon takes a confirming second press and refunds in full', async () => {
    const m = await mountMain();
    await m.press('[data-outpost-start="relay"]'); await m.press('[data-outpost-build="relay@134"]');
    await m.press('[data-outpost-abandon="relay@134"]');       // arms only
    expect((await durableProjects(m.booted.backend)).projects.sites).toHaveLength(1);
    await m.press('[data-outpost-abandon="relay@134"]');
    const d = await durableProjects(m.booted.backend);
    expect(d.projects.sites).toEqual([]); expect(Object.fromEntries(d.state.items)).toEqual({ frame: 3, plate: 2 }); expect(m.save.items).toEqual(d.state.items);
  }, 120_000);
  it('mutation controls: an unwired click, an unpublished save, or a card without the hook each fail the outcome', async () => {
    const unwired = await mountMain((s) => s.replace("document.addEventListener('click', (event) => { outpostsController.handle(event.target as Element | null); });", ''));
    await unwired.press('[data-outpost-start="relay"]');
    expect((await durableProjects(unwired.booted.backend)).projects.sites).toEqual([]); // the press never reached the runner
    const unpublished = await mountMain((s) => s.replace('save.items = outcome.state.items.map(([id, n]) => [id, n] as [string, number]);', ''));
    await unpublished.press('[data-outpost-start="relay"]'); await unpublished.press('[data-outpost-build="relay@134"]');
    const d = await durableProjects(unpublished.booted.backend);
    expect(unpublished.save.items).not.toEqual(d.state.items); // the live save would disagree with storage
    // the card hook: buildCardActions must call outpostCardActionHtml, or no card ever offers a site
    expect(MAIN_SOURCE.split('    outpostCardActionHtml(p, onThisSurface) +\n').length - 1).toBe(1);
    expect(MAIN_SOURCE.split(' + weekly + outpostBoardHtml()').length - 1).toBe(1);
  }, 120_000);
});
