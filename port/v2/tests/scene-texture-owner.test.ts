import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CanvasTextureRegistry,
  type SceneTextureLike,
} from '../apps/game/src/scene-texture-owner.js';

class FakeTexture implements SceneTextureLike {
  destroyed = false;
  source: { pixelWidth: number; pixelHeight: number } | null;
  destroyCalls: boolean[] = [];

  constructor(width: number, height: number) {
    this.source = { pixelWidth: width, pixelHeight: height };
  }

  destroy(destroySource = false): void {
    this.destroyCalls.push(destroySource);
    this.destroyed = true;
    if (destroySource) this.source = null;
  }
}

describe('scene texture ownership', () => {
  it('refcounts one canvas across scopes and destroys only after the final lease', () => {
    const resource = {};
    const texture = new FakeTexture(64, 32);
    const registry = new CanvasTextureRegistry(() => texture);
    const main = registry.createScope('main');
    const fine = registry.createScope('fine');
    expect(main.acquire(resource)).toBe(texture);
    expect(main.acquire(resource)).toBe(texture);
    expect(fine.acquire(resource)).toBe(texture);
    expect(registry.snapshot()).toMatchObject({
      activeLeaseCount: 2,
      liveTextureCount: 1,
      liveCanvasPixels: 2_048,
      liveCanvasBytes: 8_192,
      balanced: true,
      coherent: true,
    });
    fine.dispose();
    expect(texture.destroyCalls).toEqual([]);
    expect(registry.snapshot()).toMatchObject({ activeLeaseCount: 1, liveTextureCount: 1 });
    main.dispose();
    expect(texture.destroyCalls).toEqual([true]);
    expect(registry.snapshot()).toMatchObject({
      activeLeaseCount: 0,
      liveTextureCount: 0,
      liveCanvasPixels: 0,
      balanced: true,
    });
  });

  it('supports atomic same-canvas and new-canvas tier handoffs', () => {
    const low = {};
    const high = {};
    const textures = new Map<object, FakeTexture>([
      [low, new FakeTexture(64, 64)],
      [high, new FakeTexture(512, 512)],
    ]);
    const registry = new CanvasTextureRegistry((resource: object) => textures.get(resource)!);
    const scope = registry.createScope('surface');
    let current = scope.acquireLease(low, 'planet-texture');
    const same = scope.acquireLease(low, 'planet-texture');
    expect(same.texture).toBe(current.texture);
    same.release();
    expect(current.texture.destroyCalls).toEqual([]);

    const successor = scope.acquireLease(high, 'planet-texture');
    const predecessor = current;
    current = successor;
    predecessor.release();
    expect(textures.get(low)!.destroyCalls).toEqual([true]);
    expect(current.texture.destroyCalls).toEqual([]);
    scope.dispose();
    expect(textures.get(high)!.destroyCalls).toEqual([true]);
  });

  it('keeps the predecessor when successor acquisition fails', () => {
    const low = {};
    const bad = {};
    const currentTexture = new FakeTexture(128, 128);
    const failedSuccessor = new FakeTexture(0, 8);
    const registry = new CanvasTextureRegistry((resource: object) => (
      resource === low ? currentTexture : failedSuccessor
    ));
    const scope = registry.createScope('surface');
    const current = scope.acquireLease(low, 'planet-texture');
    expect(() => scope.acquireLease(bad, 'planet-texture')).toThrow(
      'scene texture source has invalid backing dimensions',
    );
    expect(current.released).toBe(false);
    expect(currentTexture.destroyCalls).toEqual([]);
    expect(failedSuccessor.destroyCalls).toEqual([true]);
    scope.dispose();
  });

  it('makes release/dispose idempotent and rejects acquire after disposal', () => {
    const texture = new FakeTexture(16, 16);
    const registry = new CanvasTextureRegistry(() => texture);
    const scope = registry.createScope('scene');
    const lease = scope.acquireLease({});
    expect(lease.release()).toBe(true);
    expect(lease.release()).toBe(false);
    scope.dispose();
    scope.dispose();
    expect(texture.destroyCalls).toEqual([true]);
    expect(() => scope.acquire({})).toThrow('scene texture scope is closed');
  });

  it('cleans a partial scope and exposes an omitted-dispose leak', () => {
    const textures = [new FakeTexture(32, 32), new FakeTexture(128, 64)];
    const registry = new CanvasTextureRegistry((index: { value: number }) => textures[index.value]!);
    const scope = registry.createScope('partial-build');
    const first = { value: 0 };
    const second = { value: 1 };
    scope.acquire(first, 'galaxy-haze');
    scope.acquire(second, 'planet-texture');
    const leaked = registry.snapshot();
    expect(leaked).toMatchObject({
      activeScopeCount: 1,
      activeLeaseCount: 2,
      liveTextureCount: 2,
      liveCanvasBytes: (32 * 32 + 128 * 64) * 4,
    });
    scope.dispose();
    expect(textures.map((texture) => texture.destroyCalls)).toEqual([[true], [true]]);
    expect(registry.snapshot()).toMatchObject({
      activeScopeCount: 0,
      activeLeaseCount: 0,
      liveTextureCount: 0,
    });
  });

  it('retains a failed final disposal as live evidence and permits a retry', () => {
    const texture = new FakeTexture(16, 16);
    const originalDestroy = texture.destroy.bind(texture);
    let fail = true;
    texture.destroy = (destroySource = false) => {
      if (fail) throw new Error('injected release failure');
      originalDestroy(destroySource);
    };
    const registry = new CanvasTextureRegistry(() => texture);
    const scope = registry.createScope('scene');
    scope.acquire({});
    expect(() => scope.dispose()).toThrow('scene texture scope failed to dispose');
    expect(registry.snapshot()).toMatchObject({
      activeScopeCount: 1,
      activeLeaseCount: 1,
      textureDisposals: 0,
      liveTextureCount: 1,
      balanced: true,
    });
    fail = false;
    scope.dispose();
    expect(registry.snapshot()).toMatchObject({ activeScopeCount: 0, liveTextureCount: 0 });
  });

  it('keeps a failed predecessor scope retryable while its successor remains live', () => {
    const predecessorResource = {};
    const successorResource = {};
    const predecessorTexture = new FakeTexture(16, 16);
    const successorTexture = new FakeTexture(32, 32);
    const originalDestroy = predecessorTexture.destroy.bind(predecessorTexture);
    let failuresRemaining = 2;
    predecessorTexture.destroy = (destroySource = false) => {
      if (failuresRemaining-- > 0) throw new Error('injected predecessor release failure');
      originalDestroy(destroySource);
    };
    const registry = new CanvasTextureRegistry((resource: object) => (
      resource === predecessorResource ? predecessorTexture : successorTexture
    ));
    const predecessor = registry.createScope('fine:predecessor');
    const successor = registry.createScope('fine:successor');
    predecessor.acquire(predecessorResource);
    successor.acquire(successorResource);
    const retired = new Set([predecessor]);
    const retryRetired = (): void => {
      for (const scope of [...retired]) {
        scope.dispose();
        retired.delete(scope);
      }
    };

    expect(retryRetired).toThrow('scene texture scope failed to dispose');
    expect(retired.size).toBe(1);
    expect(successorTexture.destroyCalls).toEqual([]);
    expect(retryRetired).toThrow('scene texture scope failed to dispose');
    expect(retired.size).toBe(1);
    expect(successorTexture.destroyCalls).toEqual([]);
    retryRetired();
    expect(retired.size).toBe(0);
    expect(predecessorTexture.destroyCalls).toEqual([true]);
    expect(successorTexture.destroyCalls).toEqual([]);
    successor.dispose();
  });

  it('diagnoses external destruction and mismatched shared-canvas kinds', () => {
    const resource = {};
    const texture = new FakeTexture(8, 8);
    const registry = new CanvasTextureRegistry(() => texture);
    const scope = registry.createScope('scene');
    scope.acquire(resource, 'scene-canvas');
    expect(() => scope.acquire(resource, 'planet-texture')).toThrow('scene canvas kind changed');
    texture.destroy(true);
    expect(registry.snapshot()).toMatchObject({ externalDestroyFaults: 1, coherent: false });
    expect(() => scope.acquire(resource)).toThrow('destroyed outside its registry');
    scope.dispose();
    expect(registry.snapshot()).toMatchObject({
      externalDestroyFaults: 1,
      liveTextureCount: 0,
      balanced: true,
      coherent: false,
    });
  });

  it('resets only the observation-window peaks', () => {
    const resources = [{}, {}];
    const registry = new CanvasTextureRegistry(() => new FakeTexture(10, 10));
    const scope = registry.createScope('scene');
    scope.acquire(resources[0]!);
    scope.acquire(resources[1]!);
    registry.beginObservationWindow();
    expect(registry.snapshot()).toMatchObject({
      observationWindow: 1,
      peakActiveLeaseCount: 2,
      lifetimePeakActiveLeaseCount: 2,
    });
    scope.dispose();
    expect(registry.snapshot().lifetimePeakActiveLeaseCount).toBe(2);
  });

  it('keeps direct Texture.from ownership limited to the registry and backdrop', () => {
    const mainPath = fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url));
    const source = readFileSync(mainPath, 'utf8');
    const calls = source.match(/Texture\.from\(/g) ?? [];
    expect(calls).toHaveLength(2);
    expect(source).toContain('(resource) => Texture.from(resource, true)');
    expect(source).toContain('bgSpr.texture = Texture.from(cv);');
    expect(source).not.toContain('Cache.reset(');
    const pixiImport = source.match(/^import \{[^;]+from 'pixi\.js';$/m)?.[0] ?? '';
    expect(pixiImport).not.toContain('RenderTexture');
    expect(source).not.toMatch(/\.generateTexture\(/);
    expect(source.match(/\bnew Text\(/g) ?? []).toHaveLength(0);
    expect(source.match(/createSceneText\(/g) ?? []).toHaveLength(11);
    expect(source.match(/destroy\(\{ children: true, context: true \}\)/g) ?? [])
      .toHaveLength(3);
    expect(source.match(/provenGalaxyCell\(state\.gal, prof, cx, cy\)/g) ?? [])
      .toHaveLength(1);
    expect(source.match(/for \(const cell of galaxyCells\)/g) ?? []).toHaveLength(2);
    expect(source.match(/\bdrawUniverse\(/g)).toHaveLength(3);
    expect(source.match(/\bdrawGalaxy\(/g)).toHaveLength(2);
    expect(source.match(/\bdrawSystem\(/g)).toHaveLength(2);
    expect(source.match(/\bdrawSurface\(/g)).toHaveLength(2);
    expect(source.match(/buildCurrentSceneTransaction\(\)/g)).toHaveLength(4);
    expect(source.indexOf('world.addChildAt(nextLayer, insertionIndex);')).toBeLessThan(
      source.lastIndexOf('retireFineTextureOwner(previousLayer, previousScope);'),
    );
    expect(source).not.toContain('previousScope?.dispose();');
    expect(source.match(/retireFineTextureOwner\(previousLayer, previousScope\);/g)).toHaveLength(2);
    expect(source).toContain('owner.scope?.dispose();\n      retiredFineTextureOwners.delete(owner);');
  });

});
