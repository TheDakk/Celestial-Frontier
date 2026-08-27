import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { assessArc4EpochSnapshot } from '../tools/arc4-browser-contract.mjs';

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);
const glassSource = readFileSync(
  new URL('../tools/glassmatrix.mjs', import.meta.url),
  'utf8',
);

type Marker = readonly [label: string, value: string];

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  expect(at, `missing section start: ${start}`).toBeGreaterThanOrEqual(0);
  expect(stop, `missing section end: ${end}`).toBeGreaterThan(at);
  return source.slice(at, stop);
}

function markerErrors(owner: string, markers: readonly Marker[]): string[] {
  return markers.flatMap(([label, value]) => owner.includes(value) ? [] : [label]);
}

function proveEachMarkerRequired(owner: string, markers: readonly Marker[]): void {
  expect(markerErrors(owner, markers)).toEqual([]);
  markers.forEach(([label, value], index) => {
    const replacement = `__SIXTH_RED_MARKER_${index}__`;
    expect(owner.split(value).length - 1, label).toBe(1);
    const mutant = owner.replace(value, replacement);
    expect(markerErrors(mutant, markers), label).toContain(label);
  });
}

describe('sixth Slice red contract repairs', () => {
  it('keeps a fixed 55-row Guide oracle with five independent population controls', () => {
    expect(sliceSource).toContain('const V2_DRAFT_BULLET_COUNT = 55;');
    const owner = section(
      sliceSource,
      '  const releaseDraftCheck = `',
      '  const releaseShipyardCopyCtl = await evalIn(',
    );
    proveEachMarkerRequired(owner, [
      ['fixed positive count', 'populated:bullets.length===${V2_DRAFT_BULLET_COUNT}'],
      ['raw nonempty and trim clauses',
        'bulletRaw.every((bullet)=>bullet.length>0&&bullet===bullet.trim())'],
      ['count deletion control', 'const releaseInventoryCtl = await evalIn('],
      ['uniqueness control', 'const releaseDuplicateCtl = await evalIn('],
      ['section population control', 'const releaseEmptySectionCtl = await evalIn('],
      ['raw empty control', 'const releaseEmptyBulletCtl = await evalIn('],
      ['raw trim control', 'const releaseWhitespaceBulletCtl = await evalIn('],
      ['removal delta',
        'releaseInventoryCtl.removed?.bulletCount !== V2_DRAFT_BULLET_COUNT - 1'],
    ]);
    expect(glassSource).toContain('expectedBulletCount=55');
    expect(glassSource).toContain('inventory?.bulletCount===54');
    expect(glassSource).not.toContain('54-outcome development inventory');
  });

  it('separates both advancing active-play mirrors from stable fixture state', () => {
    const projection = section(
      sliceSource,
      '  const arc4PertarStableStateProjection = (state) => {',
      '  const waitForArc4PertarSurface = async',
    );
    proveEachMarkerRequired(projection, [
      ['runtime projection', 'delete stable.persistence.runtime.activePlayMs;'],
      ['ecology projection',
        'delete stable.persistence.ecology.observedActivePlayMs;'],
      ['ecology before validation',
        'const beforeEcologyActivePlayMs = before?.persistence?.ecology?.observedActivePlayMs;'],
      ['ecology after validation',
        'const afterEcologyActivePlayMs = after?.persistence?.ecology?.observedActivePlayMs;'],
      ['ecology monotonicity',
        'afterEcologyActivePlayMs >= beforeEcologyActivePlayMs'],
      ['ecology bound',
        'afterEcologyActivePlayMs - beforeEcologyActivePlayMs <= 10_000'],
    ]);
    const controls = section(
      sliceSource,
      '  const arc4FixtureWrongOrdinalClockControl =',
      '  /* A one-sided durable route mutation',
    );
    proveEachMarkerRequired(controls, [
      ['runtime clock mutant',
        'next.wrongOrdinal.stateAfter.persistence.runtime.activePlayMs'],
      ['ecology clock mutant',
        'next.wrongOrdinal.stateAfter.persistence.ecology.observedActivePlayMs'],
    ]);
  });

  it('proves private epoch staging before one committed publication and reload', () => {
    const owner = section(
      sliceSource,
      '  /* DOM-1: exercise the real epoch snapshot path',
      "  await send('Target.closeTarget', { targetId: tk.targetId });",
    );
    proveEachMarkerRequired(owner, [
      ['single awaited persist',
        'persisted=await window.__CF_SLICE__.api.__smokePersistNow()'],
      ['named assessment', 'assessArc4EpochSnapshot(epochSnapshot)'],
      ['control owner',
        'const epochSnapshotControls = epochSnapshotAssessment.ok ? ['],
      ['before control', "'negative-before', ['beforeEpoch']"],
      ['optimistic precommit control', "'optimistic-precommit', ['precommitPrivate']"],
      ['optimistic publication control',
        "'optimistic-publication', ['precommitPublicationPrivate']"],
      ['candidate control', "'missing-candidate', ['precommitCandidateStaged']"],
      ['precommit edge control', "'early-edge-clear', ['precommitEdgeDue']"],
      ['committed epoch control', "'withheld-commit', ['committedEpoch']"],
      ['committed publication control',
        "'withheld-publication', ['committedPublished']"],
      ['committed candidate control',
        "'stale-committed-candidate', ['committedCandidate']"],
      ['committed edge control',
        "'uncleared-committed-edge', ['committedEdgeSettled']"],
      ['stored control', "'stored-base', ['storedCommitted']"],
      ['reload control', "'reloaded-base', ['reloadedCommitted']"],
    ]);

    const base = {
      before: 0,
      precommit: { epoch: 0, publishedEpoch: 0, candidateEpoch: 1, edgeDue: true },
      committed: { epoch: 1, publishedEpoch: 1, candidateEpoch: 1, edgeDue: false },
      stored: 1,
      reloaded: 1,
    };
    expect(assessArc4EpochSnapshot(base).ok).toBe(true);
    const controls = [
      ['beforeEpoch', (next: typeof base) => {
        next.before = -1;
        next.precommit.epoch = -1;
        next.precommit.publishedEpoch = -1;
        next.precommit.candidateEpoch = 0;
        next.committed.epoch = 0;
        next.committed.publishedEpoch = 0;
        next.committed.candidateEpoch = 0;
        next.stored = 0;
        next.reloaded = 0;
      }],
      ['precommitPrivate', (next: typeof base) => { next.precommit.epoch = 1; }],
      ['precommitPublicationPrivate',
        (next: typeof base) => { next.precommit.publishedEpoch = 1; }],
      ['precommitCandidateStaged',
        (next: typeof base) => { next.precommit.candidateEpoch = 0; }],
      ['precommitEdgeDue', (next: typeof base) => { next.precommit.edgeDue = false; }],
      ['committedPublished', (next: typeof base) => { next.committed.publishedEpoch = 0; }],
      ['committedCandidate', (next: typeof base) => { next.committed.candidateEpoch = 0; }],
      ['committedEdgeSettled', (next: typeof base) => { next.committed.edgeDue = true; }],
      ['storedCommitted', (next: typeof base) => { next.stored = 0; }],
      ['reloadedCommitted', (next: typeof base) => { next.reloaded = 0; }],
    ] as const;
    for (const [expected, mutate] of controls) {
      const next = structuredClone(base);
      mutate(next);
      const failures = Object.entries(assessArc4EpochSnapshot(next).checks)
        .filter(([, value]) => value !== true).map(([name]) => name);
      expect(failures, expected).toEqual([expected]);
    }
    const withheld = structuredClone(base);
    withheld.committed.epoch = 0;
    withheld.stored = 0;
    withheld.reloaded = 0;
    expect(Object.entries(assessArc4EpochSnapshot(withheld).checks)
      .filter(([, value]) => value !== true).map(([name]) => name))
      .toEqual(['committedEpoch']);
  });
});
