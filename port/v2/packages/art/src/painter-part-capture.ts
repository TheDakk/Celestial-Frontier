/** Optional authoring observation. Reads the winning painter's actual RGBA at
 * semantic draw boundaries; never replays paint, changes state, or consumes RNG.
 * Only pixels visibly changed by a draw stage acquire that stage's ownership.
 * Tube subdivision uses the painter's sampled axis, not a fitted skeleton. */
export interface PaintedPart { readonly id: string; readonly joint: string; readonly layer: 'far' | 'near' }
export interface PaintedPartMasks {
  readonly schema: 'cf.painter-part-masks/v1'; readonly width: number; readonly height: number;
  readonly parts: readonly PaintedPart[]; readonly labels: Uint8Array;
}
export class PainterPartCapture {
  private previous: Uint8ClampedArray;
  private readonly labels: Uint8Array;
  private readonly parts: PaintedPart[] = [];
  private active: readonly number[] = [];
  private axis: readonly (readonly [number, number])[] = [];
  private breaks: readonly number[] = [];
  private ended = false;
  constructor(private readonly width: number, private readonly height: number,
    private readonly read: () => Uint8ClampedArray) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 4096 ** 2) throw Error('Painter masks: dimensions');
    this.previous = this.snapshot();
    if (this.previous.some((v, i) => i % 4 === 3 && v !== 0)) throw Error('Painter masks require empty ink');
    this.labels = new Uint8Array(width * height);
  }
  private snapshot(): Uint8ClampedArray {
    const data = this.read();
    if (data.length !== this.width * this.height * 4) throw Error('Painter masks: RGBA dimensions');
    return data.slice();
  }
  begin(parts: readonly PaintedPart[], axis: readonly (readonly [number, number])[] = [], breaks: readonly number[] = []): void {
    if (this.ended) throw Error('Painter masks already finished');
    if (!parts.length || breaks.length !== parts.length - 1 || (parts.length > 1 && axis.length < 2) ||
        breaks.some((t, i) => !Number.isFinite(t) || t <= (i ? breaks[i - 1]! : 0) || t >= 1) ||
        axis.some(p => p.length !== 2 || p.some(v => !Number.isFinite(v)))) throw Error('Painter masks: stage geometry');
    const ids = new Set<string>();
    for (const p of parts) {
      if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id) || !p.joint || !['far', 'near'].includes(p.layer)) throw Error('Painter masks: part identity');
      ids.add(p.id);
      const old = this.parts.find(q => q.id === p.id);
      if (old && (old.joint !== p.joint || old.layer !== p.layer)) throw Error('Painter masks: conflicting identity');
    }
    if (this.parts.length + parts.filter(p => !this.parts.some(q => q.id === p.id)).length > 32) throw Error('Painter masks: part budget');
    this.flush();
    this.active = parts.map(p => {
      let i = this.parts.findIndex(q => q.id === p.id);
      if (i < 0) { i = this.parts.length; this.parts.push({...p}); }
      return i + 1;
    });
    this.axis = axis.map(p => [p[0], p[1]] as const); this.breaks = [...breaks];
  }
  private flush(): void {
    const next = this.snapshot();
    for (let i = 0; i < this.labels.length; i++) {
      const q = i * 4;
      if (!next[q + 3]) { this.labels[i] = 0; continue; }
      if (next[q] === this.previous[q] && next[q + 1] === this.previous[q + 1] && next[q + 2] === this.previous[q + 2] && next[q + 3] === this.previous[q + 3]) continue;
      if (!this.active.length) throw Error('Painter masks: unowned paint');
      let segment = 0;
      if (this.active.length > 1) {
        const x = i % this.width + .5, y = Math.floor(i / this.width) + .5;
        let distance = Infinity, station = 0;
        for (let j = 0; j < this.axis.length; j++) {
          const p = this.axis[j]!, d = (x - p[0]) ** 2 + (y - p[1]) ** 2;
          if (d < distance) { distance = d; station = j / (this.axis.length - 1); }
        }
        segment = this.breaks.filter(t => station >= t).length;
      }
      this.labels[i] = this.active[segment]!;
    }
    this.previous = next;
  }
  finish(): PaintedPartMasks {
    if (this.ended) throw Error('Painter masks already finished');
    this.flush(); this.ended = true;
    for (let i = 0; i < this.labels.length; i++) if (!!this.labels[i] !== !!this.previous[i * 4 + 3]) throw Error('Painter masks: incomplete visible coverage');
    // Fully occluded draw stages own no final pixels and produce no empty part.
    const live = new Set(this.labels), remap = new Map<number, number>(), parts: PaintedPart[] = [];
    this.parts.forEach((p, i) => { if (live.has(i + 1)) { parts.push({...p}); remap.set(i + 1, parts.length); } });
    return {schema: 'cf.painter-part-masks/v1', width: this.width, height: this.height,
      parts, labels: this.labels.map(n => n ? remap.get(n)! : 0)};
  }
}
