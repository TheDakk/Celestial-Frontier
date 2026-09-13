/* The joint-seam oracle (tools/motion-proof/seam-oracle.mjs): counts transparent pixels inside the closed body
 * envelope near a joint pivot. Synthetic controls: a body with no gap counts 0; a 6 px wedge inside the head disc
 * counts its area under `head` and nothing under a far joint; a wide legitimate concavity (wider than twice the
 * closing radius) is not a gap; the vacated space behind a moved part outside the envelope is not counted. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: new (o: { width: number; height: number }) => { data: Buffer; width: number; height: number } & { pack(): unknown } };
const { PNG: PNGSync } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { write(png: unknown): Buffer } } };

const W = 400, H = 400;
function render(fill: (x: number, y: number) => boolean): Buffer {
  const png = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const on = fill(x, y); png.data[i] = 120; png.data[i + 1] = 90; png.data[i + 2] = 60; png.data[i + 3] = on ? 255 : 0; }
  return PNGSync.sync.write(png);
}
const record = { landmarks: { root: [0.5, 0.5], pelvis: [0.3, 0.5], spine: [0.4, 0.5], chest: [0.5, 0.5], neck: [0.6, 0.5], head: [0.7, 0.4], hindFarRoot: [0.3, 0.55] } };
const run = (png: Buffer, dir: string, name: string, args: string[] = []) => {
  const p = path.join(dir, name + '.png'), r = path.join(dir, 'record.json'); writeFileSync(p, png); writeFileSync(r, JSON.stringify(record));
  return JSON.parse(execFileSync(process.execPath, [path.resolve(__dirname, '../tools/motion-proof/seam-oracle.mjs'), p, r, '--joints=head,neck,hindFarKnee', ...args], { encoding: 'utf8' }).trim()) as { gapPixelsInsideEnvelope: number; perJoint: Record<string, { seamPixels: number } | null> };
};

describe('seam oracle', () => {
  it('counts a joint wedge inside the envelope near its pivot, nothing for an intact body, nothing for a wide concavity or a far joint', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'seam-'));
    const body = (x: number, y: number) => x >= 80 && x < 320 && y >= 150 && y < 250; // one solid bar through the neck/head pivots (neck pivot at 240,200; head pivot at 240,200 -> its parent neck landmark is [0.6,0.5] = 240,200)
    const intact = run(render(body), dir, 'intact');
    expect(intact.gapPixelsInsideEnvelope).toBe(0); expect(intact.perJoint.head!.seamPixels).toBe(0); expect(intact.perJoint.neck!.seamPixels).toBe(0);
    const wedge = run(render((x, y) => body(x, y) && !(x >= 236 && x < 242 && y >= 150 && y < 250)), dir, 'wedge'); // a 6 px vertical cut through the head pivot column
    // The slot is open at both silhouette ends, so the closing fills it except within ~one radius of each end: most of 6 x 100, the same under both discs that contain it.
    expect(wedge.perJoint.head!.seamPixels).toBeGreaterThan(6 * 70); expect(wedge.perJoint.head!.seamPixels).toBeLessThanOrEqual(6 * 100); expect(wedge.perJoint.neck!.seamPixels).toBe(wedge.perJoint.head!.seamPixels); // neck's parent (chest at 200,200) is 40 px away: inside its disc
    expect(wedge.gapPixelsInsideEnvelope).toBe(wedge.perJoint.head!.seamPixels); // and nothing else anywhere
    expect(wedge.perJoint.hindFarKnee!.seamPixels).toBe(0); // hindFarRoot at (120,220): the cut is 116 px away, outside its 40 px disc
    const concavity = run(render((x, y) => body(x, y) && !(x >= 200 && x < 300 && y >= 150 && y < 200)), dir, 'concavity'); // a 100 px wide notch: wider than 2 x closing radius (8 px), not a gap
    expect(concavity.gapPixelsInsideEnvelope).toBe(0);
    const vacated = run(render((x, y) => body(x, y) && x < 260), dir, 'vacated'); // the head simply moved away: nothing enclosed, nothing counted
    expect(vacated.gapPixelsInsideEnvelope).toBe(0);
    const nullJoint = run(render(body), dir, 'unknown', ['--joints=head,nope']) as unknown as { perJoint: Record<string, unknown> }; expect(nullJoint.perJoint.nope).toBeNull();
  });
});
