import { afterEach, describe, expect, it, vi } from 'vitest';

interface FakeCanvas {
  width: number;
  height: number;
  _lowres?: boolean;
  finished?: boolean;
  thumbnailFinished?: boolean;
  drawnSources: FakeCanvas[];
  getContext(kind: string): unknown;
  toDataURL(): string;
}

function fakeCanvas(): FakeCanvas {
  const canvas: FakeCanvas = {
    width: 0,
    height: 0,
    drawnSources: [],
    getContext: () => context,
    toDataURL: () => `data:image/png;base64,${canvas.thumbnailFinished ? 'thumb-finished' : 'thumb-raw'}|${canvas.drawnSources.map((source) => source.finished ? 'finished' : 'raw').join('-')}`,
  };
  const gradient = { addColorStop: () => undefined };
  const context = new Proxy<Record<string, unknown>>({}, {
    get(target, key) {
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      if (key === 'createImageData') return (width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
      });
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      if (key === 'drawImage') return (source: FakeCanvas) => { canvas.drawnSources.push(source); };
      return () => undefined;
    },
    set(target, key, value) { return Reflect.set(target, key, value); },
  });
  return canvas;
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('generated ThumbArt planet finishing hook', () => {
  it('finishes low/high sprites before both direct and lexical thumbnail consumers regardless of call order', async () => {
    const deferred: Array<() => void> = [];
    const canvases: FakeCanvas[] = [];
    vi.stubGlobal('CARD_FACTS', new Map());
    vi.stubGlobal('_hdLater', (run: () => void) => { deferred.push(run); });
    vi.stubGlobal('getGalaxySprite', () => {
      const canvas = fakeCanvas();
      canvas.finished = true;
      return canvas;
    });
    vi.stubGlobal('_quasarSpr', () => fakeCanvas());
    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        if (tag !== 'canvas') throw new Error(`unexpected element ${tag}`);
        const canvas = fakeCanvas();
        canvases.push(canvas);
        return canvas;
      },
    });
    const art = await import('../src/thumbart.verbatim.js');
    const finished = new WeakSet<object>();
    let spriteFinishes = 0;
    const thumbCalls: Array<{ kind: string; identity: string }> = [];
    art.installPlanetSpriteFinisher((surface) => {
      if (!finished.has(surface)) {
        finished.add(surface);
        (surface as unknown as FakeCanvas).finished = true;
        spriteFinishes++;
      }
      return surface;
    });
    art.installThumbSurfaceFinisher((surface, kind, identity) => {
      (surface as unknown as FakeCanvas).thumbnailFinished = true;
      thumbCalls.push({ kind, identity });
      return surface;
    });

    const thumbFirst = art.planetThumb({ seed: 9001, type: 'terran', ring: false });
    expect(thumbFirst).toContain('thumb-finished|finished');
    const directFirst = art.getPlanetSprite({ seed: 9002, type: 'rocky', ring: false });
    expect((directFirst as unknown as FakeCanvas).finished).toBe(true);
    const directThenThumb = art.planetThumb({ seed: 9002, type: 'rocky', ring: false });
    expect(directThenThumb).toContain('thumb-finished|finished');
    expect(spriteFinishes).toBe(2);

    expect(art.starThumb('G', '#fff')).toContain('thumb-finished');
    expect(art.starThumb('BH', '#000')).toContain('thumb-finished');
    expect(art.galaxyThumb({ seed: 91, sp: 0 })).toContain('thumb-finished');
    expect(art.moonThumb(0, 92)).toContain('thumb-finished');
    expect(art.cometThumb()).toContain('thumb-finished');
    expect(art.beltThumb()).toContain('thumb-finished');
    expect(thumbCalls).toEqual([
      { kind: 'planet', identity: 'terran' },
      { kind: 'planet', identity: 'rocky' },
      { kind: 'star', identity: 'G' },
      { kind: 'star', identity: 'BH' },
      { kind: 'galaxy', identity: 'galaxy' },
      { kind: 'moon', identity: '0' },
      { kind: 'comet', identity: 'comet' },
      { kind: 'belt', identity: 'belt' },
    ]);

    for (const run of deferred.splice(0)) run();
    const high = art.getPlanetSprite({ seed: 9001, type: 'terran', ring: false });
    expect((high as unknown as FakeCanvas).finished).toBe(true);
    expect(spriteFinishes).toBeGreaterThanOrEqual(3);
    expect(canvases.some((canvas) => canvas.finished)).toBe(true);
  });
});
