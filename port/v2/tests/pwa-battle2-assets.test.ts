import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readBattle2AssetPins, verifyBattle2AssetFiles, BATTLE2_ASSET_SCHEMA } from '../apps/game/pwa-battle2-assets.js';
import { sha256Hex, pwaBuildIdV1, celestialFrontierPwaPlugin, shippedPackByteInputsV1, __pwaBuildTestOnly } from '../apps/game/pwa-build.js';
import { readFileSync } from 'node:fs';

describe('pinned battle2 public-file inventory', () => {
  it('the build plugin includes public pins with a nested base and rechecks emitted files', () => {
    const root=mkdtempSync(join(tmpdir(),'cf-battle2-build-'));
    try {
      mkdirSync(join(root,'public/battle2'),{recursive:true});
      mkdirSync(join(root,'dist/battle2'),{recursive:true});
      mkdirSync(join(root,'dist/assets'),{recursive:true});
      writeFileSync(join(root,'public/battle2/atlas.png'),'paint');
      writeFileSync(join(root,'dist/battle2/atlas.png'),'paint');
      writeFileSync(join(root,'battle2-assets.json'),JSON.stringify({schema:BATTLE2_ASSET_SCHEMA,files:[{path:'battle2/atlas.png',bytes:5,sha256:sha256Hex('paint')}]}));
      const bundle: Record<string,{type:'asset';source:string}> = {'index.html':{type:'asset',source:'index'}};
      for(const prefix of ['species-art','biome-vista','earth-resident'])bundle['assets/'+prefix+'.worker-unit.js']={type:'asset',source:'export const value=1;'};
      for(const [file,v] of Object.entries(bundle))writeFileSync(join(root,'dist',file),v.source);
      // Exercise the actual Vite plugin hooks; the synthetic assets avoid a second app build.
      const plugin=celestialFrontierPwaPlugin();let worker='';
      const configure=plugin.configResolved as (config:unknown)=>void;
      configure({root,base:'/game/',build:{outDir:'dist'}});
      const generate=plugin.generateBundle as (this:unknown,options:unknown,bundle:unknown)=>void;
      generate.call({emitFile:(v:{source:string})=>{worker=v.source;}},{},bundle);
      expect(worker).toContain('"path":"/game/battle2/atlas.png"');
      expect(worker).toContain('"cache":"first-use"');
      const write=(plugin.writeBundle as {handler:(options:unknown)=>void}).handler;
      write({dir:join(root,'dist')});
      writeFileSync(join(root,'dist/battle2/atlas.png'),'wrong');
      expect(()=>write({dir:join(root,'dist')})).toThrow(/bytes differ/);
    } finally {rmSync(root,{recursive:true,force:true});}
  });
  it('requires every shipped public file and validates both producer and final-output bytes', () => {
    const root=mkdtempSync(join(tmpdir(),'cf-battle2-pins-'));
    try {
      expect(readBattle2AssetPins(root)).toEqual([]);
      mkdirSync(join(root,'public/battle2'),{recursive:true});
      writeFileSync(join(root,'public/battle2/atlas.png'),'atlas');
      expect(()=>readBattle2AssetPins(root)).toThrow(/require battle2-assets/);
      const files=[{path:'battle2/atlas.png',bytes:5,sha256:sha256Hex('atlas')}];
      const manifest=(rows:unknown)=>writeFileSync(join(root,'battle2-assets.json'),JSON.stringify({schema:BATTLE2_ASSET_SCHEMA,files:rows}));
      manifest(files);expect(readBattle2AssetPins(root)).toEqual(files);
      verifyBattle2AssetFiles(join(root,'public'),files);
      writeFileSync(join(root,'public/battle2/extra.png'),'extra');
      expect(()=>readBattle2AssetPins(root)).toThrow(/inventory/);
      rmSync(join(root,'public/battle2/extra.png'));
      writeFileSync(join(root,'public/battle2/atlas.png'),'other');
      expect(()=>readBattle2AssetPins(root)).toThrow(/bytes differ/);
      expect(()=>verifyBattle2AssetFiles(join(root,'public'),files)).toThrow(/bytes differ/);
      writeFileSync(join(root,'public/battle2/atlas.png'),'atlas');
      for(const mutant of [[],[...files,...files],[{...files[0],path:'battle2/../secret'}],[{...files[0],path:'battle2/%2e%2e/secret'}],[{...files[0],bytes:6}],[{...files[0],sha256:'0'.repeat(64)}]]) {
        manifest(mutant);expect(()=>readBattle2AssetPins(root)).toThrow();
      }
      manifest(files);rmSync(join(root,'public/battle2/atlas.png'));symlinkSync(join(root,'battle2-assets.json'),join(root,'public/battle2/atlas.png'));
      expect(()=>readBattle2AssetPins(root)).toThrow(/symlinks/);
    } finally {rmSync(root,{recursive:true,force:true});}
  });
  it('binds first-use mode, byte count and digest into build identity without changing old eager rows', () => {
    const file={path:'/battle2/atlas.png',bytes:5,sha256:sha256Hex('atlas'),cache:'first-use' as const};
    const index={path:'/index.html',sha256:sha256Hex('index')};
    const id=pwaBuildIdV1([index,file]);
    expect(pwaBuildIdV1([file,index])).toBe(id);
    expect(pwaBuildIdV1([index,{...file,bytes:6}])).not.toBe(id);
    expect(pwaBuildIdV1([index,{path:file.path,sha256:file.sha256}])).not.toBe(id);
    expect(()=>pwaBuildIdV1([index,{...file,path:'/foreign/atlas.png'}])).toThrow();
    expect(()=>pwaBuildIdV1([index,{...file,path:'/battle2/../atlas.png'}])).toThrow();
  });
});

/** D30 (Dakk, 2026-10-02): every painted arena ships as WebP runtime copies inside the 128 MiB offline pack (the cap is unchanged). The
 * pinned battle2 files are read from the producer's manifest; the runtime bundle is a fixed allowance ABOVE the measured vite build
 * (25,199,306 bytes on 2026-10-02, see audits/ARENA_WEBP_D30_20261002/README.md), so a pass here does not depend on a build in the test. */
describe('D30 arena pack: WebP arenas fit the unchanged 128 MiB cap, today and with all 45 sets registered', () => {
  const game = new URL('../apps/game/', import.meta.url), repo = new URL('../../../', import.meta.url);
  const pins = (JSON.parse(readFileSync(new URL('battle2-assets.json', game), 'utf8')) as { files: { path: string; bytes: number }[] }).files;
  const sets = (JSON.parse(readFileSync(new URL('src/battle2/arena-sets.generated.json', game), 'utf8')) as { sets: { id: string; far: string; mid: string; near: string }[] }).sets;
  const receipt = JSON.parse(readFileSync(new URL('audits/ARENA_WEBP_D30_20261002/receipt.json', repo), 'utf8')) as { sets: { id: string; plates: Record<string, { source: string; sourceBytes: number; webp: string; bytes: number }> }[] };
  const RUNTIME_ALLOWANCE = 32 * 1048576, WORKER_ALLOWANCE = 1048576, CAP = 134_217_728, TARGET = 115 * 1048576;
  const plates = sets.flatMap((s) => [s.far, s.mid, s.near]), pinOf = (rel: string) => pins.find((p) => p.path === 'battle2/' + rel);
  const arenaPin = (p: { path: string }) => /(^|\/)arena-(far|mid|near)(-despilled)?\.(png|webp)$/.test(p.path) && !p.path.includes('/keyed/wild-');
  const nonArena = pins.filter((p) => !plates.includes(p.path.slice('battle2/'.length))).map((p) => p.bytes), sum = (xs: number[]) => xs.reduce((n, b) => n + b, 0);
  it('every registered set ships exactly its three WebP plates (no PNG arena plate in the pack); the pack is under the cap and the 115 MiB target', () => {
    for (const rel of plates) { expect(rel, rel).toMatch(/\.webp$/); expect(pinOf(rel), rel).toBeDefined(); }
    expect(pins.filter(arenaPin).map((p) => p.path).filter((p) => p.endsWith('.png')), 'no PNG arena plate ships').toEqual([]);
    const total = __pwaBuildTestOnly.assertShippedPackBytes(shippedPackByteInputsV1({ runtime: [RUNTIME_ALLOWANCE], battle2: pins.map((p) => p.bytes), library: 0 }), WORKER_ALLOWANCE);
    expect(total).toBeLessThanOrEqual(TARGET);
  });
  it('synthetic: registering ALL 45 sets (every receipted WebP triplet, from the actual file sizes) stays under the cap and the target', () => {
    expect(receipt.sets).toHaveLength(45);
    const webp = receipt.sets.flatMap((s) => Object.values(s.plates).map((p) => readFileSync(new URL(p.webp, repo)).byteLength));
    expect(webp).toEqual(receipt.sets.flatMap((s) => Object.values(s.plates).map((p) => p.bytes)));
    const total = __pwaBuildTestOnly.assertShippedPackBytes([RUNTIME_ALLOWANCE, ...nonArena, ...webp], WORKER_ALLOWANCE);
    expect(total).toBeLessThanOrEqual(TARGET);
  });
  it('negative controls: the 45 sets at their PNG runtime size bust the cap; one byte past the remaining headroom is caught', () => {
    const png = receipt.sets.flatMap((s) => Object.values(s.plates).map((p) => readFileSync(new URL(p.source, repo)).byteLength));
    expect(() => __pwaBuildTestOnly.assertShippedPackBytes([RUNTIME_ALLOWANCE, ...nonArena, ...png], WORKER_ALLOWANCE)).toThrow(/exceeds 128 MiB/u);
    const webp = receipt.sets.flatMap((s) => Object.values(s.plates).map((p) => p.bytes)), headroom = CAP - (RUNTIME_ALLOWANCE + WORKER_ALLOWANCE + sum(nonArena) + sum(webp));
    expect(headroom).toBeGreaterThan(0);
    expect(() => __pwaBuildTestOnly.assertShippedPackBytes([RUNTIME_ALLOWANCE, ...nonArena, ...webp, headroom + 1], WORKER_ALLOWANCE)).toThrow(/exceeds 128 MiB/u);
  });
});
