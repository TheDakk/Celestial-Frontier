// A survey is one committed receipt with no random draw: the star's kind or the world's type joins the record,
// with the achievements that proves and the rank that leaves. A survey that shows nothing new writes nothing.
// LEGACY celestial-frontier.html, v1.8.9: `noteSurvey` 16451-16462, the star's card 5234, the world's card 5194.
// The surveyed set and `stats.surveys` are not a survey's: the legacy game writes them when the biosphere is
// scanned (`autoScanWorld` 14888-14892).
import { describe, expect, it } from 'vitest';
import { resolveCF1StarAddress, type CanonicalCF1StarAddress } from '@cf/scene';
import type { GameEvents } from '../src/events';
import { LEASE_TTL_MS, REGISTRY, createSaveRuntime } from '../src/save/index';
import {
  SURVEY_RECEIPT_KIND_V1,
  commitSurveyActionV1,
  deriveSurveyFactV1,
  prepareSurveySettlementV1,
  settleSurveyV1,
  type SurveyAddressV1,
  type SurveyAuthorityV1,
  type SurveyTransactionV1,
} from '../src/world';
import { actionPage, type ActionPageOptions } from './action-support';
import { SOL, solWorld } from './landing-support';
import { NOW, dump, namedState } from './save-support';

const HOME = { seed: 999, x: 90, y: -60 };
/** Stars of the home galaxy, by what a survey finds there (the painted port's tests/arc9-survey-action.test.ts). */
const STARS = {
  sol: { seed: 424242, x: 560, y: 170 },
  binary: { seed: 904783243, x: -884.7057853611186, y: -219.026545856148 },
  BH: { seed: 4278635935, x: -686.1230598092079, y: -733.0088191400282 },
  NS: { seed: 729068929, x: -736.7237938377075, y: 61.177555879577994 },
  MAG: { seed: 2563295997, x: -718.0755883874372, y: -258.9377444498241 },
  WD: { seed: 1052211025, x: -687.3863019808196, y: -418.28537888545543 },
  RG: { seed: 1426111096, x: -768.9087665411644, y: -95.77863371931016 },
  SG: { seed: 563950025, x: -338.65479613188654, y: -195.42429688666016 },
  PROTO: { seed: 412604657, x: -715.1403196742758, y: -157.66362113971263 },
  BD: { seed: 406337352, x: -864.4042974715121, y: -349.37369136465713 },
} as const;
function star(name: keyof typeof STARS): CanonicalCF1StarAddress {
  const resolved = resolveCF1StarAddress({ galaxy: HOME, star: STARS[name] });
  if (!resolved.ok) throw new Error(`star ${name} did not resolve: ${resolved.reason}`);
  return resolved.address;
}

async function surveyPage(options: ActionPageOptions = {}) {
  const page = await actionPage(options);
  const done: Array<GameEvents['survey:done']> = [];
  page.bus.on('survey:done', (event) => { done.push(event); });
  return { ...page, done, survey: (address: SurveyAddressV1) => settleSurveyV1({ door: page.loop, bus: page.bus, live: () => page.live }, { address, codecNow: NOW }) };
}

describe('what a survey reads off a star or a world', () => {
  it('a star gives its kind, whether it is a pair, and whether it is Sol', () => {
    expect(deriveSurveyFactV1(star('sol'))).toMatchObject({ target: 'star', starKind: 'G', binary: false, sol: true, eventAchievementIds: ['sol'] });
    expect(deriveSurveyFactV1(star('binary'))).toMatchObject({ target: 'star', starKind: 'A', binary: true, sol: false, eventAchievementIds: ['binary'] });
  });

  it('each of the eight uncommon kinds of star has its own achievement', () => {
    const owners = { BH: 'seebh', NS: 'seens', MAG: 'seemag', WD: 'seewd', RG: 'seerg', SG: 'seesg', PROTO: 'seeproto', BD: 'seebd' } as const;
    for (const [kind, id] of Object.entries(owners) as Array<[keyof typeof owners, string]>) {
      expect(deriveSurveyFactV1(star(kind)), kind).toMatchObject({ target: 'star', starKind: kind, eventAchievementIds: [id] });
    }
  });

  it('a world gives its type, and nothing of its life', () => {
    expect(deriveSurveyFactV1(solWorld(SOL.earth))).toEqual({ target: 'world', addressKey: solWorld(SOL.earth).key, planetSeed: SOL.earth, planetType: 'terran', eventAchievementIds: [] });
    expect(deriveSurveyFactV1(solWorld(SOL.jupiter))).toMatchObject({ planetType: 'gas' });
  });

  it('a survey does not mark a living world surveyed: that is the biosphere scan\'s', () => {
    const state = namedState('Vega');
    const prepared = prepareSurveySettlementV1(state, solWorld(SOL.earth));
    expect(prepared.kind).toBe('ready');
    if (prepared.kind !== 'ready') return;
    expect(prepared.successorState.surveyedSet).toEqual([]);
    expect(prepared.successorState.stats.surveys).toBe(state.stats.surveys);
    expect(prepared.successorState.ptypesSeen).toEqual(['terran']);
  });

  it('an address that is not a registered star or world is refused', () => {
    const forged = { ...star('binary'), star: star('sol').star } as CanonicalCF1StarAddress;
    expect(prepareSurveySettlementV1(namedState('Vega'), forged)).toEqual({ kind: 'protected', reason: 'source-unproven' });
  });
});

describe('a survey is one committed receipt', () => {
  it('a first survey of Sol writes the kind, the achievement and the receipt in one revision, and draws nothing', async () => {
    const page = await surveyPage();
    const before = { revision: page.runtime.revision, ordinal: page.runtime.diagnostics().sessionOrdinal, state: page.durable() };
    const outcome = await page.survey(star('sol'));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.addedAchievementIds).toContain('sol');
    expect(outcome.state.starKindsSeen).toEqual(['G']);
    expect(outcome.state.unlocked).toContain('sol');
    // Nothing else of the save moves.
    expect({ ...outcome.state, starKindsSeen: before.state.starKindsSeen, unlocked: before.state.unlocked, stats: before.state.stats })
      .toEqual(before.state);
    expect(page.runtime.revision).toBe(before.revision + 1);
    expect(outcome.transaction.receipt).toMatchObject({ kind: SURVEY_RECEIPT_KIND_V1, ordinal: before.ordinal });
    expect(await page.repository.readReceipt(before.ordinal)).toEqual(outcome.transaction.receipt);
    expect(page.runtime.diagnostics()).toMatchObject({ sessionOrdinal: before.ordinal + 1, sessionDraws: {} });
    expect((await page.stored()).state).toEqual(outcome.state);
    expect(page.live.starKindsSeen).toEqual(['G']);
    expect(page.outcomes.committed).toEqual([{ kind: 'survey', receiptOrdinal: before.ordinal }]);
    expect(page.done).toEqual([{ address: star('sol') }]);
  });

  it('a second survey of the same star shows nothing new: no receipt, no revision, and the survey is still said', async () => {
    const page = await surveyPage();
    await page.survey(star('sol'));
    const before = await dump(page.backend);
    expect(await page.survey(star('sol'))).toMatchObject({ kind: 'current', facts: { target: 'star', starKind: 'G' } });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.done).toHaveLength(2);
    // Locking a card a second time is not a refused action.
    expect(page.outcomes.refused).toEqual([]);
  });

  it('asked of storage directly, a survey with nothing new still takes no receipt', async () => {
    const page = await surveyPage({ change: (state) => { state.starKindsSeen = ['G']; state.unlocked = ['sol']; } });
    const before = await dump(page.backend);
    expect(await commitSurveyActionV1({ runtime: page.runtime, state: page.durable(), address: star('sol'), codecNow: NOW }))
      .toMatchObject({ kind: 'current', facts: { starKind: 'G', sol: true } });
    expect(await dump(page.backend)).toEqual(before);
  });

  it('a world adds its type; a second world of the same type adds nothing', async () => {
    const page = await surveyPage();
    const earth = await page.survey(solWorld(SOL.earth));
    expect(earth.kind === 'committed' && earth.state.ptypesSeen).toEqual(['terran']);
    const jupiter = await page.survey(solWorld(SOL.jupiter));
    expect(jupiter.kind === 'committed' && jupiter.state.ptypesSeen).toEqual(['terran', 'gas']);
    expect((await page.survey(solWorld(SOL.saturn))).kind).toBe('current');
    expect(page.live.surveyedSet).toEqual([]);
    expect(await page.receipts()).toHaveLength(2);
  });

  it('the eighth kind of star closes the Stellar Census in the same receipt', async () => {
    // LEGACY 16458 `checkAch`, and the achievement's own test over the kinds seen.
    const page = await surveyPage({ change: (state) => { state.starKindsSeen = ['G', 'A', 'BH', 'NS', 'MAG', 'WD', 'RG']; } });
    const outcome = await page.survey(star('SG'));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.state.starKindsSeen).toHaveLength(8);
    expect(outcome.addedAchievementIds).toEqual(expect.arrayContaining(['seesg', 'stellarset']));
    expect(outcome.state.unlocked).toEqual(expect.arrayContaining(['seesg', 'stellarset']));
  });
});

describe('a survey that cannot be stored changes nothing', () => {
  it('after the lease is lost the survey is refused, writes nothing and says so', async () => {
    const page = await surveyPage();
    const successor = createSaveRuntime({
      backend: page.backend, registry: REGISTRY, initialRevision: page.runtime.revision, initialExtensions: page.runtime.extensions,
      initialState: page.durable(), restoredAuthority: null, freshSessionSeed: 9,
      ownerId: 'tab', token: 'document-b', leaseTtlMs: LEASE_TTL_MS, now: page.time.now, visible: true, answerable: true,
    });
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'held-by-other' });
    page.time.advance(LEASE_TTL_MS + 1); // this page's lease ran out unrenewed
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const before = await dump(page.backend);
    expect(await page.survey(star('sol'))).toMatchObject({ kind: 'refused', detail: 'lost' });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.live.starKindsSeen).toEqual([]);
    expect(page.outcomes.refused).toEqual([{ kind: 'survey', reason: 'lost' }]);
    expect(page.done).toEqual([]);
  });

  it('under a write hold the survey is refused and storage is not touched', async () => {
    const page = await surveyPage();
    page.gate.holdTransient('storage failed');
    const before = await dump(page.backend);
    expect(await page.survey(star('sol'))).toEqual({ kind: 'refused', detail: 'held', transaction: null });
    expect(await dump(page.backend)).toEqual(before);
  });

  it('a stored result that is not the survey\'s own is not taken for it', async () => {
    type Committed = Extract<SurveyTransactionV1, { readonly kind: 'committed' }>;
    const forged = (change: (state: Committed['state']) => Partial<Committed['state']>) => (o: Committed): Committed => {
      const state = { ...o.state, ...change(o.state) };
      return { ...o, state, saved: { ...o.saved, canonicalState: state } };
    };
    const forgeries: ReadonlyArray<readonly [string, (outcome: Committed) => Committed]> = [
      ['operation', (o) => ({ ...o, plan: { ...o.plan, operation: 'forged' } })],
      ['receipt kind', (o) => ({ ...o, receipt: { ...o.receipt, kind: 'forged' } })],
      ['receipt witness', (o) => ({ ...o, receipt: { ...o.receipt, witness: 'forged' } })],
      ['receipt ordinal', (o) => ({ ...o, receipt: { ...o.receipt, ordinal: o.receipt.ordinal + 1 } })],
      ['stored state', (o) => ({ ...o, saved: { ...o.saved, canonicalState: { ...o.saved.canonicalState, hp: 9 } } })],
      ['kinds seen', forged(() => ({ starKindsSeen: [] }))],
      ['achievement', forged(() => ({ unlocked: [] }))],
      ['another field', forged((state) => ({ essence: state.essence + 1 }))],
    ];
    for (const [name, forge] of forgeries) {
      const page = await surveyPage();
      const forging: SurveyAuthorityV1 = {
        commitAction: async (input) => { const outcome = await page.runtime.commitAction(input); return outcome.kind === 'committed' ? forge(outcome) : outcome; },
      };
      expect(await commitSurveyActionV1({ runtime: forging, state: page.durable(), address: star('sol'), codecNow: NOW }), name)
        .toMatchObject({ kind: 'committed-convergence' });
    }
  });
});
