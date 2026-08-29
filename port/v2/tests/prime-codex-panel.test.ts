import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PRIME_SIGNATURES_V1 } from '@cf/domain-combatcore';
import {
  FRONTIER_ENDING_IDS,
  importSaveV2,
  type CodexEntry,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import {
  FRONTIER_ENDINGS_V1,
  projectPrimeCodexV1,
  renderPrimeCodexPanelV1,
} from '../apps/game/src/prime-codex-panel.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Prime Codex base save failed: ${imported.reason}`);
  return imported.state;
}

function claimAll(state: SaveStateV2): SaveStateV2 {
  for (const signature of PRIME_SIGNATURES_V1) {
    state.primeFill[signature.id] = {
      title: signature.guardianName,
      sub: signature.signatureName,
      tier: signature.tier,
      hex: '#9fb6d6',
      where: null,
    };
  }
  state.frontierUnlocked = true;
  return state;
}

function codexEntry(index: number): [string, CodexEntry] {
  const id = `species-${index}`;
  return [id, {
    id, name: `Species ${index}`, kind: 'fauna', tier: null,
    realm: 'material', sapient: 0, from: 'test', hybrid: false, g: {}, where: null,
  }];
}

describe('Prime Codex projection', () => {
  it('projects the exact nine canonical signatures and five established endings', () => {
    const state = claimAll(baseState());
    const projection = projectPrimeCodexV1(state);
    expect(projection).toMatchObject({
      schema: 'cf-v2-prime-codex-panel/v1',
      kind: 'projected', claimedCount: 9, frontierUnlocked: true,
      frontier: { kind: 'open', balance: { unlocked: false } },
    });
    expect(projection.rows.map(({ definition }) => definition.id)).toEqual(
      PRIME_SIGNATURES_V1.map(({ id }) => id),
    );
    expect(FRONTIER_ENDINGS_V1.map(({ id }) => id)).toEqual(FRONTIER_ENDING_IDS);
    expect(FRONTIER_ENDINGS_V1.map(({ title }) => title)).toEqual([
      'Sovereign of the Frontier', 'Warden of Life', 'World-Shaper',
      'The Unseen Hand', 'Prismatic Pathfinder',
    ]);

    const html = renderPrimeCodexPanelV1(projection, {
      pending: false, writable: true, status: null,
    });
    expect(html.match(/data-prime-signature-id=/gu)).toHaveLength(9);
    expect(html.match(/data-frontier-ending-id=/gu)).toHaveLength(5);
    expect(html).toContain('data-frontier-ending-id="balance" disabled');
    for (const signature of PRIME_SIGNATURES_V1) {
      expect(html).toContain(signature.guardianName.replace('’', '’'));
    }
    const readOnlyHtml = renderPrimeCodexPanelV1(projection, {
      pending: false, writable: false, status: 'Read only',
    });
    expect(readOnlyHtml.match(/disabled aria-disabled="true"/gu)).toHaveLength(5);

    state.frontierEnding = 'protect';
    const chosen = projectPrimeCodexV1(state);
    expect(chosen).toMatchObject({
      kind: 'projected',
      frontier: { kind: 'chosen', ending: { id: 'protect', title: 'Warden of Life' } },
    });
    const chosenHtml = renderPrimeCodexPanelV1(chosen, {
      pending: false, writable: true, status: null,
    });
    expect(chosenHtml).toContain('data-frontier-state="chosen"');
    expect(chosenHtml).not.toContain('data-frontier-ending-id=');
  });

  it('uses the existing Balance predicate and exposes no alternative unlock rule', () => {
    const state = claimAll(baseState());
    state.conquered = Array.from({ length: 3 }, (_, index) => [
      index + 1, { t: 0, tier: 1 },
    ]);
    state.codex = Array.from({ length: 40 }, (_, index) => codexEntry(index));
    const projection = projectPrimeCodexV1(state);
    expect(projection).toMatchObject({
      kind: 'projected',
      frontier: {
        kind: 'open',
        balance: {
          conqueredWorlds: 3, mindClaimed: true, cataloguedSpecies: 40, unlocked: true,
        },
      },
    });
    const html = renderPrimeCodexPanelV1(projection, {
      pending: false, writable: true, status: null,
    });
    expect(html).toContain('data-frontier-ending-id="balance"');
    expect(html).not.toContain('data-frontier-ending-id="balance" disabled');
  });

  it('protects unknown endings and inconsistent unlock authority without overwriting evidence', () => {
    const future = claimAll(baseState());
    future.frontierEnding = 'future-path';
    const futureBefore = JSON.stringify(future);
    const futureProjection = projectPrimeCodexV1(future);
    expect(futureProjection).toMatchObject({
      kind: 'protected', reason: 'frontier-ending-unknown',
      frontier: { kind: 'protected', endingToken: 'future-path' },
    });
    const futureHtml = renderPrimeCodexPanelV1(futureProjection, {
      pending: false, writable: true, status: null,
    });
    expect(futureHtml).toContain('Preserved ending id: <code>future-path</code>');
    expect(futureHtml).not.toContain('data-frontier-ending-id=');
    expect(JSON.stringify(future)).toBe(futureBefore);

    const mismatch = baseState();
    mismatch.frontierUnlocked = true;
    expect(projectPrimeCodexV1(mismatch)).toMatchObject({
      kind: 'protected', reason: 'frontier-unlocked-mismatch', claimedCount: 0,
    });
  });

  it('escapes imported claim copy and rejects accessors without invoking them', () => {
    const state = claimAll(baseState());
    state.primeFill.stone!.title = '<img src=x onerror=alert(1)>';
    const projected = projectPrimeCodexV1(state);
    expect(projected.kind).toBe('projected');
    const html = renderPrimeCodexPanelV1(projected, {
      pending: false, writable: false, status: '<unsafe>',
    });
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;unsafe&gt;');

    let touched = false;
    const hostile = baseState();
    Object.defineProperty(hostile, 'primeFill', {
      enumerable: true,
      get() { touched = true; return {}; },
    });
    expect(projectPrimeCodexV1(hostile)).toMatchObject({
      kind: 'protected', reason: 'prime-fill-shape',
    });
    expect(touched).toBe(false);
  });
});
