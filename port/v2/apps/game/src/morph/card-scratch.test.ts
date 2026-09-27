import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, it, vi } from 'vitest';
import { FITS, REPO_ROOT, repoJson, type FitName, type FitRecord } from '../battle2/parts-rig.fixtures.js';
import { compileBodyCard } from '../motion/body-card.js';
import { cardCompositeV1, renderCardIndividualV1, type CardMasterV1, type CardReceiptV1 } from './morph-card.js';
import { morphParamsV1 } from './morph-params.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array } } } };
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const load = (name: FitName) => { const dir = FITS[name]; const m = PNG.sync.read(readFileSync(new URL(dir + 'card/master-512.png', REPO_ROOT))), l = PNG.sync.read(readFileSync(new URL(dir + 'card/labels-512.png', REPO_ROOT)));
  const receipt = repoJson<CardReceiptV1 & { recordRecipeHash: string }>(dir + 'card/card.json'), record = repoJson<FitRecord>(dir + 'record.json');
  return { master: { width: m.width, height: m.height, master: new Uint8Array(m.data), labels: new Uint8Array(l.data) } as CardMasterV1, receipt, card: compileBodyCard(record, record.genome), recipe: receipt.recordRecipeHash }; };

type TransferBuffer = ArrayBuffer & { transfer(newByteLength: number): ArrayBuffer };
const proto = ArrayBuffer.prototype as TransferBuffer;
it('preserves every pre-repair raster byte and caller input in 120 real-fixture morphs', () => {
 const baseline = repoJson<{ rows: Array<{name:FitName;genome:Record<string,number>;size:number;diagonal:boolean;sha256:string}> }>('audits/I5_CARD_SCRATCH_20260927/pixel-baseline.json');
 expect(baseline.rows).toHaveLength(120);
 for (const row of baseline.rows) { const f = load(row.name), master = sha(f.master.master), labels = sha(f.master.labels);
  const out = renderCardIndividualV1({...f,params:morphParamsV1(row.genome,f.recipe),size:row.size,diagonal:row.diagonal});
  expect(sha(out),JSON.stringify(row)).toBe(row.sha256); expect(sha(f.master.master)).toBe(master); expect(sha(f.master.labels)).toBe(labels);
 }
}, 20000);
it('releases actual completed scratch stores, preserves caller-owned masters/masks and published outputs, including refusal', () => {
 const real = proto.transfer, released:Array<{buffer:ArrayBuffer;bytes:number}>=[];
 const spy = vi.spyOn(proto,'transfer').mockImplementation(function(this:ArrayBuffer, size:number) { released.push({buffer:this,bytes:this.byteLength}); return real.call(this,size); });
 try {
  const f=load('civet'), before=sha(f.master.master), labels=sha(f.master.labels), mask={width:f.master.width,height:f.master.height,alpha:new Uint8Array(f.master.width*f.master.height).fill(160)}, maskBefore=sha(mask.alpha);
  const params=morphParamsV1({seed:3,color:1,accent:4,head:7,tail:6},f.recipe);
  const out=renderCardIndividualV1({...f,params,size:132,markingMask:mask});
  expect(out.byteLength).toBe(132*132*4);expect(released.filter(r=>r.bytes===768*768*4).length).toBeGreaterThanOrEqual(3);
  expect(released.every(r=>r.buffer.byteLength===0)).toBe(true);expect(sha(f.master.master)).toBe(before);expect(sha(f.master.labels)).toBe(labels);expect(sha(mask.alpha)).toBe(maskBefore);
  const composite=cardCompositeV1({...f,params});expect(composite.byteLength).toBe(f.master.master.byteLength);
  expect(cardCompositeV1({...f,params:morphParamsV1({},f.recipe)})).toBe(f.master.master);
  const count=released.length;expect(()=>renderCardIndividualV1({...f,params,size:0})).toThrow('card: size');expect(released.length).toBeGreaterThan(count);expect(released.every(r=>r.buffer.byteLength===0)).toBe(true);
 } finally { spy.mockRestore(); }
});
it('renders identical bytes when transfer is unavailable', () => {
 const f=load('civet'), input={...f,params:morphParamsV1({head:7,tail:6},f.recipe),size:132},expected=sha(renderCardIndividualV1(input));
 const original=Object.getOwnPropertyDescriptor(proto,'transfer')!;
 try { Object.defineProperty(proto,'transfer',{...original,value:undefined});expect(sha(renderCardIndividualV1(input))).toBe(expected); }
 finally { Object.defineProperty(proto,'transfer',original); }
});
