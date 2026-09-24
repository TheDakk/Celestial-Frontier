import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readBattle2AssetPins, verifyBattle2AssetFiles, BATTLE2_ASSET_SCHEMA } from '../apps/game/pwa-battle2-assets.js';
import { sha256Hex, pwaBuildIdV1, celestialFrontierPwaPlugin } from '../apps/game/pwa-build.js';

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
