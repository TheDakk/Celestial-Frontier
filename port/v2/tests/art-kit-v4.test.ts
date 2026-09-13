import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {produceCanonicalEarthSnapshot} from '../tools/landfall-snapshot/entry.js';
import {compileEarthArtKitV4,compileEarthKitEngineV4} from '../apps/game/src/landfall-conditioning.js';

const kit=readFileSync(new URL('../../../ART_KIT.md',import.meta.url),'utf8');
describe('approved v4 prompt compilation, without a checkout lock or inference',()=>{
  it('reproduces a data-filled card and exact kit blocks without mutating the snapshot',()=>{
    const source=produceCanonicalEarthSnapshot().snapshot,before=JSON.stringify(source);
    const result=compileEarthArtKitV4(source,kit);
    expect(result).toEqual(compileEarthArtKitV4(source,kit));
    expect(JSON.stringify(source)).toBe(before);
    expect(result.systemCard).toContain('SYSTEM CARD - Sol / Earth; CF1|g:999@90,-60|s:424242@560,170|p:133#2');
    expect(result.systemCard).toContain('G; a yellow sun-like star; #fff4d8; radius 26');
    expect(result.systemCard).toContain('seaHue 210, landHue 115, iceAmt 0.5');
    expect(result.prompts.map(row=>row.name)).toEqual(['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry']);
    const frozen=kit.split('  Rich natural-history fantasy painting,')[1]!.split('\n\nThe scene-contact')[0]!;
    for(const row of [...result.prompts,result.plate]){
      expect(row.prompt).toContain('  Rich natural-history fantasy painting,'+frozen);
      const markers=['Match the exact visual language','Rich natural-history fantasy painting','SYSTEM CARD -','\nSUBJECT\n',...(row.kind==='cut-out'?['\nACCURACY\n']:[]),'\nLAYOUT\n','\nTECHNICAL OUTPUT\n','\nNEGATIVE\n'];
      expect(markers.map(marker=>row.prompt.indexOf(marker))).toEqual(markers.map(marker=>row.prompt.indexOf(marker)).sort((a,b)=>a-b));
      expect(row.prompt).not.toMatch(/<[^>]+>/);
      expect(row.systemCard).toBe(result.systemCard);
    }
    const civet=result.prompts.find(row=>row.name==='Civet')!;
    expect(civet.prompt).toContain('four limbs, two fore and two hind, exactly four limbs');
    expect(civet.prompt).toContain('spotted natural fur');
    expect(civet.prompt).toContain('matte warm grey-ochre fur (#a8996f)');
    expect(result.plate.prompt).not.toContain('Background must be one flat uniform magenta fill');
    expect(result.plate.prompt).not.toContain('\nACCURACY\n');
    expect(result.familyReferences.map(row=>[row.family,row.name,row.realm])).toEqual([
      ['mammal quadruped','Fox','land'],['bird','Pheasant','land'],['fish','Trout','aquatic'],['insect','Beetle','land'],['reptile','Skink','land']]);
    expect(result.familyReferences.every(row=>row.liveResident===false)).toBe(true);
    expect(result.familyReferences.find(row=>row.family==='insect')!.prompt).toContain('six jointed legs, three near and three far, exactly six legs');
    expect(result.familyReferences.find(row=>row.family==='fish')!.prompt).toContain('no legs, zero legs');
    expect(result.qualityAccepted).toBe(false);
  });
  it('rejects the retired kit, missing/duplicated blocks and mutated source identity',()=>{
    const source=produceCanonicalEarthSnapshot().snapshot;
    expect(()=>compileEarthArtKitV4(source,kit.replace('style_id: frontier   |   version 4.2,','style_id: frontier   |   version 3,'))).toThrow('v4 required');
    expect(()=>compileEarthArtKitV4(source,kit.replace('## 2. Frozen style','## 2. Lost style'))).toThrow('Missing kit section');
    expect(()=>compileEarthArtKitV4(source,kit+'\n## 2. Frozen style\n')).toThrow('Missing kit section');
    const mutant=JSON.parse(JSON.stringify(source));mutant.roster.starSeed=44;
    expect(()=>compileEarthArtKitV4(mutant,kit)).toThrow('source refused');
    const renamed=JSON.parse(JSON.stringify(source));renamed.displayPlan.residents[0].name='Invented beast';
    expect(()=>compileEarthArtKitV4(renamed,kit)).toThrow('source refused');
  });
});


describe('authorized contact experiment runtime projection',()=>{
  it('keeps the frozen paragraph, visual card, subject and layout; excludes authoring metadata',()=>{
    const source=produceCanonicalEarthSnapshot().snapshot;
    const job=JSON.parse(readFileSync(new URL('../../../audits/ART_KIT_CONTACT_REVISION_20260912/prepared/recipe.json',import.meta.url),'utf8'));
    const names=['civet','persimmon','platypus','frog','devils-club','cranberry'];
    const assets={plate:job.plate,atlas:job.atlas,triptych:job.triptych,foreground:job.foreground,
      residents:Object.fromEntries(names.map((n,i)=>[n,job.passes[i].reference]))};
    const result=compileEarthKitEngineV4(source,kit,assets,job);
    expect(result.finisherPrompt).toBe(job.finisherPrompt);
    expect(result.finisherPrompt).toContain(compileEarthArtKitV4(source,kit).frozenParagraph);
    expect(result.finisherPrompt).toMatch(/Light:.*\nMineral palette:.*\nAtmosphere:.*\nPigments:/);
    expect(result.finisherPrompt).not.toMatch(/SHA|[a-f0-9]{64}|Approved by Nick|Paste|TECHNICAL|NEGATIVE|\d+ percent|\d+%|2560|1440|REFERENCE LOCK/);
    expect(result.textTokenCeiling).toBe(512);expect(result.skipOrganismPasses).toBe(true);
    expect(result.passes.every(p=>!('prompt' in p))).toBe(true);
    expect(result.sourceSnapshot).toEqual(source);
    const withNewNegative=kit.replace('No lens flare','No synthetic forbidden diagnostic object, no lens flare');
    expect(compileEarthKitEngineV4(source,withNewNegative,assets,job).finisherPrompt).toBe(result.finisherPrompt);
    const {foreground,...withoutForeground}=assets;
    expect(()=>compileEarthKitEngineV4(source,kit,withoutForeground,job)).toThrow('foreground unavailable');
  });
});
