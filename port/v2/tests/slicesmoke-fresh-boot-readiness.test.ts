import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assessF4ReadyAuthority } from '../tools/slicesmoke-contract.mjs';

const source = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);

const documentToken = 'document-token-0001';

interface AuthorityFixture {
  state: {
    persistence: {
      schema: string;
      ready: boolean;
      bootKind: string | null;
      hold: string | null;
      seedBootstrapPending: boolean;
      bootRouteRepairPending: boolean;
      mutationBlocked: boolean;
      documentToken: string;
      runtime: {
        schema: string;
        visible: boolean;
        answerable: boolean;
        leaseOwned: boolean;
        accruing: boolean;
        staleBlocked: boolean;
        revision: number;
        sessionSeed: number;
        sessionOrdinal: number;
        sessionDraws: { world: number; reward: number };
      };
    };
    sceneResources?: { pendingPersistenceWrites: number };
  };
  raw: {
    revisionRaw: string;
    revision: number;
    playerSchema: number;
    carrierVersion: number;
    seed: number;
    ordinal: number;
    draws: { world: number; reward: number };
  };
  token: string;
}

function authority(bootKind: string | null = 'current-v5'): AuthorityFixture {
  return {
    state: {
      persistence: {
        schema: 'cf-v2-app-persistence/v1',
        ready: true,
        bootKind,
        hold: null,
        seedBootstrapPending: false,
        bootRouteRepairPending: false,
        mutationBlocked: false,
        documentToken,
        runtime: {
          schema: 'cf-v2-f4-runtime/v1',
          visible: true,
          answerable: true,
          leaseOwned: true,
          accruing: true,
          staleBlocked: false,
          revision: 5,
          sessionSeed: 0x1234_5678,
          sessionOrdinal: 3,
          sessionDraws: { world: 2, reward: 1 },
        },
      },
      sceneResources: { pendingPersistenceWrites: 0 },
    },
    raw: {
      revisionRaw: '5',
      revision: 5,
      playerSchema: 5,
      carrierVersion: 1,
      seed: 0x1234_5678,
      ordinal: 3,
      draws: { world: 2, reward: 1 },
    },
    token: documentToken,
  };
}

function invocation(anchor: string, startNeedle: string, endNeedle: string) {
  const anchorAt = source.indexOf(anchor);
  expect(anchorAt, `missing source anchor ${anchor}`).toBeGreaterThanOrEqual(0);
  expect(source.indexOf(anchor, anchorAt + 1), `duplicate source anchor ${anchor}`).toBe(-1);
  const start = source.lastIndexOf(startNeedle, anchorAt);
  expect(start, `missing invocation start for ${anchor}`).toBeGreaterThanOrEqual(0);
  const end = source.indexOf(endNeedle, anchorAt);
  expect(end, `missing invocation end for ${anchor}`).toBeGreaterThan(anchorAt);
  return source.slice(start, end + endNeedle.length);
}

describe('Slice F4 fresh-boot writable authority', () => {
  it('fails closed for absent authority input', () => {
    expect(assessF4ReadyAuthority()).toEqual({
      ok: false,
      reasons: [
        'boot readiness',
        'document identity',
        'live authority',
        'revision parity',
        'durable RNG parity',
      ],
    });
  });

  it('keeps current-v5 as the default and admits only explicit initial fresh-v5 provenance', () => {
    const current = authority();
    const fresh = authority('fresh-v5');
    const frozenFresh = structuredClone(fresh);

    expect(assessF4ReadyAuthority(current)).toEqual({ ok: true, reasons: [] });
    expect(assessF4ReadyAuthority(fresh)).toEqual({
      ok: false,
      reasons: ['boot readiness'],
    });
    expect(assessF4ReadyAuthority({ ...fresh, allowFresh: true })).toEqual({
      ok: false,
      reasons: ['boot readiness'],
    });
    expect(assessF4ReadyAuthority({
      ...fresh,
      allowFresh: true,
      expectedToken: documentToken,
    })).toEqual({
      ok: true,
      reasons: [],
    });
    expect(assessF4ReadyAuthority({ ...current, allowFresh: true })).toEqual({
      ok: true,
      reasons: [],
    });
    expect(fresh).toEqual(frozenFresh);

    for (const bootKind of ['migrated-v4', 'protected-v5', null]) {
      expect(assessF4ReadyAuthority({
        ...authority(bootKind),
        allowFresh: true,
        expectedToken: documentToken,
      }).ok).toBe(false);
    }
  });

  it('admits migrated-v4 only at one explicit exact-document boundary', () => {
    const migrated = authority('migrated-v4');
    expect(assessF4ReadyAuthority(migrated)).toEqual({
      ok: false,
      reasons: ['boot readiness'],
    });
    expect(assessF4ReadyAuthority({ ...migrated, allowMigrated: true })).toEqual({
      ok: false,
      reasons: ['boot readiness'],
    });
    expect(assessF4ReadyAuthority({
      ...migrated,
      allowMigrated: true,
      expectedToken: documentToken,
    })).toEqual({ ok: true, reasons: [] });
    expect(assessF4ReadyAuthority({
      ...migrated,
      allowMigrated: true,
      expectedToken: 'different-document-token',
    }).reasons).toEqual(['boot readiness', 'document identity']);
    expect(assessF4ReadyAuthority({
      ...migrated,
      allowMigrated: true,
      expectedToken: documentToken,
      previousToken: 'prior-document-token',
    }).reasons).toEqual(['boot readiness', 'document identity']);
    expect(assessF4ReadyAuthority({
      ...authority('protected-v5'),
      allowMigrated: true,
      expectedToken: documentToken,
    }).ok).toBe(false);

    const controls: Array<[string, (candidate: AuthorityFixture) => void, string]> = [
      ['pending persistence', (candidate) => {
        candidate.state.sceneResources = { pendingPersistenceWrites: 1 };
      }, 'boot readiness'],
      ['lease loss', (candidate) => {
        candidate.state.persistence.runtime.leaseOwned = false;
      }, 'live authority'],
      ['revision drift', (candidate) => { candidate.raw.revision += 1; }, 'revision parity'],
      ['RNG drift', (candidate) => { candidate.raw.seed += 1; }, 'durable RNG parity'],
    ];
    for (const [label, mutate, reason] of controls) {
      const candidate = structuredClone(migrated);
      mutate(candidate);
      const result = assessF4ReadyAuthority({
        ...candidate,
        allowMigrated: true,
        expectedToken: documentToken,
      });
      expect(result.ok, label).toBe(false);
      expect(result.reasons, label).toContain(reason);
    }
  });

  it('binds fresh acceptance to an initial document and exact same-document settlement', () => {
    const fresh = authority('fresh-v5');
    expect(assessF4ReadyAuthority({
      ...fresh,
      allowFresh: true,
      expectedToken: documentToken,
    })).toEqual({ ok: true, reasons: [] });
    expect(assessF4ReadyAuthority({
      ...fresh,
      allowFresh: true,
      expectedToken: 'different-document-token',
    }).reasons).toContain('document identity');
    expect(assessF4ReadyAuthority({
      ...fresh,
      allowFresh: true,
      previousToken: 'prior-document-token',
      expectedToken: documentToken,
    }).reasons).toEqual(['boot readiness', 'document identity']);

    const current = authority();
    expect(assessF4ReadyAuthority({
      ...current,
      previousToken: 'prior-document-token',
    })).toEqual({ ok: true, reasons: [] });
    expect(assessF4ReadyAuthority({
      ...current,
      allowFresh: true,
      previousToken: 'prior-document-token',
    }).reasons).toContain('document identity');
    expect(assessF4ReadyAuthority({
      ...current,
      previousToken: documentToken,
    }).reasons).toContain('document identity');
    expect(assessF4ReadyAuthority({
      ...current,
      previousToken: 'short',
    }).reasons).toContain('document identity');
    expect(assessF4ReadyAuthority({
      ...current,
      expectedToken: 'short',
    }).reasons).toContain('document identity');
  });

  it('keeps every readiness, lease, revision, and RNG control discriminating in fresh mode', () => {
    const fresh = authority('fresh-v5');
    const cases: Array<[string, (candidate: ReturnType<typeof authority>) => void, string]> = [
      ['missing scene resources', (candidate) => { delete candidate.state.sceneResources; }, 'boot readiness'],
      ['pending persistence', (candidate) => { candidate.state.sceneResources = { pendingPersistenceWrites: 1 }; }, 'boot readiness'],
      ['held persistence', (candidate) => { candidate.state.persistence.hold = 'protected-payload'; }, 'boot readiness'],
      ['bootstrap pending', (candidate) => { candidate.state.persistence.seedBootstrapPending = true; }, 'boot readiness'],
      ['route repair pending', (candidate) => { candidate.state.persistence.bootRouteRepairPending = true; }, 'boot readiness'],
      ['mutation blocked', (candidate) => { candidate.state.persistence.mutationBlocked = true; }, 'boot readiness'],
      ['lease lost', (candidate) => { candidate.state.persistence.runtime.leaseOwned = false; }, 'live authority'],
      ['not answerable', (candidate) => { candidate.state.persistence.runtime.answerable = false; }, 'live authority'],
      ['not accruing', (candidate) => { candidate.state.persistence.runtime.accruing = false; }, 'live authority'],
      ['stale authority', (candidate) => { candidate.state.persistence.runtime.staleBlocked = true; }, 'live authority'],
      ['revision drift', (candidate) => { candidate.raw.revision += 1; }, 'revision parity'],
      ['seed drift', (candidate) => { candidate.raw.seed += 1; }, 'durable RNG parity'],
      ['ordinal drift', (candidate) => { candidate.raw.ordinal += 1; }, 'durable RNG parity'],
      ['draw drift', (candidate) => { candidate.raw.draws.reward += 1; }, 'durable RNG parity'],
    ];

    for (const [name, mutate, reason] of cases) {
      const candidate = structuredClone(fresh);
      mutate(candidate);
      const assessment = assessF4ReadyAuthority({
        ...candidate,
        allowFresh: true,
        expectedToken: documentToken,
      });
      expect(assessment.ok, name).toBe(false);
      expect(assessment.reasons, name).toContain(reason);
    }
    expect(assessF4ReadyAuthority({
      ...fresh,
      allowFresh: true,
      expectedToken: documentToken,
    })).toEqual({
      ok: true,
      reasons: [],
    });
  });

  it('opts in at all 28 fresh underlying waits and nowhere else', () => {
    expect(source).toContain("const desktopToken = await navigateToSlice(sess, URL0, 'desktop boot');");
    expect(source).toContain('const freshDesktopDocumentToken = desktopToken;');
    expect(source).toContain('const freshKeyboardDocumentToken = await navigateToSlice(');
    expect(source).toContain('const freshPhoneDocumentToken = await navigateToSlice(');
    expect(source).not.toContain('const freshDesktopDocumentToken = await sliceToken(');
    expect(source).not.toContain('const freshKeyboardDocumentToken = await sliceToken(');
    expect(source).not.toContain('const freshPhoneDocumentToken = await sliceToken(');

    const directFresh = [
      ['waitForF4Writable', 'keyboard Milky Way Survey predecessor F4 authority', 'freshDesktopDocumentToken'],
      ['waitForF4Writable', 'pointer Milky Way Survey predecessor F4 authority', 'freshDesktopDocumentToken'],
      ['waitForF4Writable', 'second pointer Milky Way Survey predecessor F4 authority', 'freshDesktopDocumentToken'],
      ['waitForF4Writable', 'Milky Way arrival F4 fixed point', 'freshDesktopDocumentToken'],
      ['waitForF4Writable', 'Charter non-Sol Survey predecessor F4 authority', 'freshDesktopDocumentToken'],
      ['waitForF4Writable', 'Sol Survey predecessor F4 authority', 'freshDesktopDocumentToken'],
      ['waitForF4Writable', 'Sol arrival F4 fixed point', 'freshDesktopDocumentToken'],
      ['waitKF4Writable', 'keyboard journey Milky Way Survey predecessor F4 authority', 'freshKeyboardDocumentToken'],
      ['waitKF4Writable', 'keyboard journey Milky Way arrival F4 fixed point', 'freshKeyboardDocumentToken'],
      ['waitKF4Writable', 'keyboard journey Sol Survey predecessor F4 authority', 'freshKeyboardDocumentToken'],
      ['waitKF4Writable', 'keyboard journey Sol arrival F4 fixed point', 'freshKeyboardDocumentToken'],
      ['waitKF4Writable', 'keyboard journey Earth Survey predecessor F4 authority', 'freshKeyboardDocumentToken'],
      ['waitKF4Writable', 'keyboard journey repeat Earth Survey predecessor F4 authority', 'freshKeyboardDocumentToken'],
      ['waitNavPhF4Writable', 'phone Milky Way card predecessor F4 authority', 'freshPhoneDocumentToken'],
      ['waitNavPhF4Writable', 'phone Milky Way arrival F4 fixed point', 'freshPhoneDocumentToken'],
      ['waitNavPhF4Writable', 'phone Earth Survey predecessor F4 authority', 'freshPhoneDocumentToken'],
      ['waitNavPhF4Writable', 'phone Earth Land predecessor after Guide closure F4 authority', 'freshPhoneDocumentToken'],
      ['waitNavPhF4Writable', 'phone Earth Land writable surface settlement', 'freshPhoneDocumentToken'],
      ['waitNavPhF4Writable', 'phone repeat Earth Survey predecessor F4 authority', 'freshPhoneDocumentToken'],
      ['waitNavPhF4Writable', 'phone stage-0 fine-star Survey predecessor F4 authority', 'freshPhoneDocumentToken'],
    ] as const;
    for (const [waiter, label, token] of directFresh) {
      const call = invocation(`'${label}'`, `await ${waiter}(`, ');');
      expect(call, label).toContain('allowFresh: true');
      expect(call, label).toContain(`expectedToken: ${token}`);
    }

    const helperFresh = [
      ['waitForDesktopSurveyFixedPoint', 'Charter non-Sol Survey'],
      ['waitForDesktopSurveyFixedPoint', 'Sol Survey'],
      ['waitForKeyboardSurveyFixedPoint', 'keyboard journey Sol Survey'],
      ['waitForKeyboardSurveyFixedPoint', 'keyboard journey Earth Survey'],
      ['waitForKeyboardSurveyFixedPoint', 'keyboard journey repeat Earth Survey'],
      ['waitForPhoneSurveyFixedPoint', 'phone Earth Survey'],
      ['waitForPhoneSurveyFixedPoint', 'phone repeat Earth Survey'],
      ['waitForPhoneSurveyFixedPoint', 'phone stage-0 fine-star Survey'],
    ] as const;
    for (const [helper, label] of helperFresh) {
      expect(invocation(`label: '${label}'`, `await ${helper}({`, '\n  });'), label)
        .toContain('allowFresh: true');
    }

    const preexistingFreshControls = [
      ['collision identity fresh authority', 'collisionFreshToken'],
      ['F4 heartbeat storage writable authority', 'heartbeatFreshToken'],
      ['F4 revision verification writable authority', 'revisionFreshToken'],
    ] as const;
    for (const [label, token] of preexistingFreshControls) {
      const call = invocation(`'${label}'`, 'await waitControlF4Writable(', ');');
      expect(call, label).toContain('allowFresh: true');
      expect(call, label).toContain(`expectedToken: ${token}`);
    }
    expect(source.match(/allowFresh: true/gu)).toHaveLength(31);
  });

  it('keeps reload/replacement descendants current-only', () => {
    const strictDirect = [
      ['waitForF4Writable', 'pointer Earth Survey predecessor F4 authority'],
      ['waitForF4Writable', 'keyboard Earth Survey predecessor F4 authority'],
      ['waitForF4Writable', 'clipboard denial Share predecessor F4 authority'],
      ['waitForF4Writable', 'clipboard success Share predecessor F4 authority'],
      ['waitNavPhF4Writable', 'fresh-phone veteran replacement F4 authority'],
      ['waitNavPhF4Writable', 'phone stage-2 fine-star Survey predecessor F4 authority'],
      ['waitNavPhF4Writable', 'phone stage-2 fine-star arrival F4 fixed point'],
      ['waitNavPhF4Writable', 'PRIME RADIUS Survey predecessor F4 authority'],
    ] as const;
    for (const [waiter, label] of strictDirect) {
      expect(invocation(`'${label}'`, `await ${waiter}(`, ');'), label)
        .not.toContain('allowFresh: true');
    }
    expect(invocation(
      "label: 'phone stage-2 fine-star Survey'",
      'await waitForPhoneSurveyFixedPoint({',
      '\n  });',
    )).not.toContain('allowFresh: true');
  });

  it('scopes migrated authority to the held universe-to-galaxy control only', () => {
    const predecessor = invocation(
      "'universe-to-galaxy zoom predecessor F4 authority'",
      'await waitForF4Writable(',
      ');',
    );
    expect(predecessor).toContain('allowMigrated: true');
    expect(predecessor).toContain('expectedToken: homeZoomHeartbeatQuiescence.documentToken');
    const settlement = invocation(
      "label: 'universe-to-galaxy zoom',",
      'await waitForF4ActionSequenceFixedPoint({',
      '\n  });',
    );
    expect(settlement).toContain('allowMigrated: true');
    expect(source.match(/allowMigrated: true/gu)).toHaveLength(2);
  });
});
