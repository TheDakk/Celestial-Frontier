import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { transformSync } from 'rolldown/utils';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { crossGenome } from '@cf/domain-genetics';
import { hashInt } from '@cf/domain-rand';
import { snapshotSpeciesGenome, speciesVisualKey } from '@cf/art/species-identity';
import { QUAD_SPEC } from '../packages/art/src/quadrupedoverrides.js';
import { planFor } from '../packages/art/src/proceduraloverrides.js';
import { createCreatureBlenderBridge, assertCreatureBlenderOutputDirectory, type CreatureBlenderPhenotype } from '../tools/creature-blender-export.mjs';

const root=fileURLToPath(new URL('../../..',import.meta.url));
let bridge: ReturnType<typeof createCreatureBlenderBridge>;
let records: readonly CreatureBlenderPhenotype[];
const copy=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const one=(id:string)=>{const record=records.find(row=>row.id===id);if(!record)throw new Error(`missing ${id}`);return record;};
const fan=()=>Array.from({length:60},(_,i)=>{const heat=Math.floor(i/20),s=i%20;return makeGenome(hashInt(0xF00D,heat*25+s,7)>>>0,'fauna',heat);});
beforeAll(()=>{bridge=createCreatureBlenderBridge();records=bridge.specimens();});

describe('offline complete-genome morphology bridge',()=>{
  it('exports accepted Earth Civet through its actual viverrid owner and rejects swapped identity/proportions',()=>{
    const recipe=JSON.parse(fs.readFileSync(path.join(root,'audits/RAIN_E_ADOPTION_20260912/recipe.json'),'utf8'));
    const genome=recipe.sourceSnapshot.roster.view.all.find((g:Genome)=>g._earthName==='Civet');
    const row=bridge.exportGenome(genome,'earth-civet');
    expect(row.genome).toEqual(genome);expect(row.speciesVisualKey).toBe(speciesVisualKey(genome));
    expect(row.route.painter).toBe('faunaQuadruped → faunaMammalD → faunaResetViverridD');
    expect(row.morphology?.kind).toBe('viverrid-d');expect(row.admission.status).toBe('supported');
    expect(row.morphology?.proportions).toMatchObject({groundY:.795,left:.3,right:.65,headRx:.07,muzzleLen:.125,legW:.022});
    expect(bridge.verify(row)).toBe(true);
    const changed=copy(row) as any;changed.genome._earthName='Wolf';expect(()=>bridge.verify(changed)).toThrow('phenotype mismatch');
    const moved=copy(row) as any;moved.morphology.proportions.headRx=.2;expect(()=>bridge.verify(moved)).toThrow('phenotype mismatch');
  });
  it('accepts an erased type-only module marker while rejecting runtime module boundaries',()=>{
    const source=fs.readFileSync(path.join(root,'port/v2/tools/creature-blender-export.mjs'),'utf8');
    const matches=[...source.matchAll(/^function evaluate\([\s\S]*?^}/gm)];
    expect(matches).toHaveLength(1);
    const evaluate=new Function('transformSync',`return (${matches[0]![0]});`)(transformSync) as
      (text:string,environment:Record<string,unknown>,names:string[])=>Record<string,unknown>;
    expect(evaluate('export type Value = number;\nconst value: Value = 7;',{},['value'])).toEqual({value:7});
    for(const boundary of ['export default 7;', 'export let value = 7;', 'import "unsupported-side-effect";']) {
      expect(()=>evaluate(boundary,{},[])).toThrow('unsupported source module boundary');
    }
  });
  it('retains the exact pilot Wolf and its final named canid owner rather than routing its raw genes',()=>{
    const wolf=one('wolf');
    expect(wolf.genome).toEqual({...makeGenome(792844710,'fauna',1),_earthName:'Wolf'});
    expect(wolf.speciesVisualKey).toBe(speciesVisualKey(wolf.genome));
    expect(wolf.route).toMatchObject({kind:'named',kingdom:'fauna',name:'Wolf',painter:'faunaQuadruped → faunaMammalC → faunaResetCanidC'});
    expect(wolf.morphology?.spec).toEqual(QUAD_SPEC.Wolf);
    expect(wolf.morphology?.lineage).toBeNull();
    expect(wolf.admission.status).toBe('supported');
    expect(wolf.visualAcceptance).toBe('UNREVIEWED');
    expect(wolf.anatomicalAnimation).toBe('incomplete');
    expect(bridge.verify(wolf)).toBe(true);
  });
  it('exports the Wolf reset proportions in normalized pre-fit painter units',()=>{
    const morphology=one('wolf').morphology!;
    expect(morphology.coordinates).toEqual({space:'painter-normalized',canvasSize:440,x:'right',y:'down',fittedRaster:false});
    expect(morphology.proportions).toMatchObject({groundY:.805,bodyW:.368,left:.275,headRx:.103,headRy:.075,muzzleLen:.077,earH:.058,legW:.029,tailLen:.205,tailW:.036});
    expect(morphology.proportions!.bodyH).toBeCloseTo(.1377*1.10,12);
    expect(morphology.proportions!.legLen).toBeCloseTo(.155*1.05,12);
    expect(morphology.proportions!.right).toBeCloseTo(.275+.368,12);
    expect(morphology.palette).toMatchObject({base:'#7d7f86',cr:125,cg:127,cb:134});
  });
  it('retains both real ordered crosses and exact zero-based Wolf seed provenance',()=>{
    const wolf=one('wolf').genome as Genome;
    const seed=hashInt(0xA11E57,2*10000+1000,0x4D)>>>0,alien=makeGenome(seed,'fauna',0);
    for(const [id,a,b] of [['wolf-lineage-ab',wolf,alien],['wolf-lineage-ba',alien,wolf]] as const){
      const record=one(id),child=crossGenome(a,b);
      expect(record.genome).toEqual(snapshotSpeciesGenome(child));
      expect(record.speciesVisualKey).toBe(speciesVisualKey(child));
      expect(record.inputProvenance?.seedRecipe).toEqual({row:2,slot:1,attempt:0,seed,heat:0,contrastSearch:false});
      expect(record.route).toMatchObject({kind:'reviewed-lineage',kingdom:'fauna',name:'Wolf'});
      expect(record.morphology?.lineage?.anchor).toBeCloseTo(.73,12);
      expect(record.morphology?.lineage?.paths.length).toBeGreaterThan(6);
      expect(record.admission.status).toBe('static-fallback');
      expect(bridge.verify(record)).toBe(true);
    }
    expect(one('wolf-lineage-ab').speciesVisualKey).not.toBe(one('wolf-lineage-ba').speciesVisualKey);
  });
  it('does not flatten genuine mixed-kingdom Wolf lineage to its child kingdom',()=>{
    const wolf=one('wolf').genome as Genome;
    const children=Array.from({length:16},(_,i)=>crossGenome(wolf,makeGenome(i+1,'flora',0)));
    const child=children.find(g=>g.kingdom==='flora'&&g._earthBlendKingdom==='fauna');
    expect(child).toBeDefined();
    const exported=bridge.exportGenome(child!,'mixed-wolf');
    expect(exported.genome.kingdom).toBe('flora');
    expect(exported.route).toMatchObject({kind:'reviewed-lineage',kingdom:'fauna',name:'Wolf'});
    expect(exported.admission.status).toBe('static-fallback');
  });
  it('rejects a pure-Wolf recipe claim when named metadata still makes the real painter draw lineage drift',()=>{
    // Deliberate malformed/conflicting metadata control; never an authored fixture.
    const g={...one('wolf').genome,_earthBlend:'Wolf',_earthBlendKingdom:'fauna',_anchorVal:.46};
    const result=bridge.exportGenome(g,'conflicting-named-lineage');
    expect(result.morphology?.lineage?.anchor).toBeCloseTo(.46,12);
    expect(result.admission.status).toBe('static-fallback');
  });
  it('keeps markerless lineage and unhandled names on explicit static compatibility fallbacks',()=>{
    const child={...one('wolf-lineage-ab').genome};delete child._earthBlendKingdom;
    expect(bridge.exportGenome(child).route).toMatchObject({kind:'compatibility-fallback',painter:null});
    expect(bridge.exportGenome({...one('wolf').genome,_earthName:'Elephant'}).admission.status).toBe('static-fallback');
  });
  it('exports the real procedural plan but never substitutes the Wolf rig',()=>{
    const record=one('procedural-quad-control'),plan=planFor(record.genome);
    expect(plan?.kind).toBe('quad');
    expect(record.morphology?.plan).toEqual(plan);
    expect(record.morphology?.proportions?.bodyW).toBeCloseTo(plan?.kind==='quad'?plan.spec.len!:0,12);
    expect(record.admission.status).toBe('static-fallback');
    const extra=fan().find(g=>{const p=planFor(g);return p?.kind==='quad'&&(p.spec.alien?.legPairs??2)>2;});
    expect(extra).toBeDefined();
    expect(bridge.exportGenome(extra!).admission.status).toBe('static-fallback');
    const unsupported=fan().find(g=>planFor(g)===null);expect(unsupported).toBeDefined();
    expect(bridge.exportGenome(unsupported!).route.painter).toBe('verbatim-specialized-fallback');
    for(const kingdom of ['fungi','microbe','flora'])expect(bridge.exportGenome(makeGenome(42,kingdom,1)).route).toMatchObject({kind:'unsupported-owner',painter:null});
  });
  it('detaches every genome field, including unknown nested metadata, without seed-only identity',()=>{
    const g={...one('wolf').genome,reviewExtra:{nested:[1,'retained',null]}};
    const exported=bridge.exportGenome(g,'detached');g.reviewExtra.nested[0]=2;
    expect(exported.genome.reviewExtra).toEqual({nested:[1,'retained',null]});
    expect(exported.speciesVisualKey).not.toBe(speciesVisualKey(g));
    expect(Object.isFrozen(exported.genome)).toBe(true);
    expect(speciesVisualKey(JSON.parse(JSON.stringify(exported.genome)))).toBe(exported.speciesVisualKey);
  });
  it.each([
    ['undefined',undefined],['NaN',NaN],['Infinity',Infinity],['negative zero',-0],['bigint',1n],['function',()=>1],['symbol',Symbol('test')],
  ])('rejects JSON identity loss for %s',(_label,value)=>{
    expect(()=>bridge.exportGenome({...one('wolf').genome,lossy:value})).toThrow(/JSON/);
  });
  it('rejects missing morphology inputs, cycles, sparse arrays and getters without invoking them',()=>{
    const missing={...one('wolf').genome};delete missing.body;
    expect(()=>bridge.exportGenome(missing)).toThrow(/missing genome field/);
    const cyclic:Record<string,unknown>={...one('wolf').genome};cyclic.self=cyclic;
    expect(()=>bridge.exportGenome(cyclic)).toThrow(/JSON/);
    expect(()=>bridge.exportGenome({...one('wolf').genome,sparse:new Array(2)})).toThrow(/sparse/);
    let invoked=false;const getter={...one('wolf').genome};Object.defineProperty(getter,'hidden',{enumerable:true,get(){invoked=true;return 1;}});
    expect(()=>bridge.exportGenome(getter)).toThrow(/accessor/);expect(invoked).toBe(false);
  });
  it('verifies actual source bytes and rejects identity, proportions, status and ancestry substitutions',()=>{
    for(const source of one('wolf').sources){const bytes=fs.readFileSync(path.join(root,source.path));expect(source.bytes).toBe(bytes.length);expect(source.sha256).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));}
    for(const key of ['speciesidentity.ts','quadrupedoverrides.ts','speciesoverrides.ts','proceduraloverrides.ts'])expect(one('wolf').sources.some(s=>s.path.endsWith(key))).toBe(true);
    const mutations:((r:any)=>void)[]=[r=>r.speciesVisualKey='seed-only',r=>r.morphology.proportions.bodyW=.1,r=>r.admission.status='static-fallback',r=>r.sources[0].sha256='0'.repeat(64),r=>r.visualAcceptance='PASS',r=>r.unknownClaim=true];
    for(const mutate of mutations){const record=copy(one('wolf'));mutate(record);expect(()=>bridge.verify(record)).toThrow();}
    for(const mutate of [(r:any)=>r.inputProvenance.seedRecipe.row=3,(r:any)=>r.inputProvenance.parents[0].seed=1,(r:any)=>r.inputProvenance.order.reverse()]){const record=copy(one('wolf-lineage-ab'));mutate(record);expect(()=>bridge.verify(record)).toThrow(/provenance/);}
  });
});
const temporary:string[]=[];
afterAll(()=>temporary.forEach(dir=>fs.rmSync(dir,{recursive:true,force:true})));
it('requires a new private output and refuses source/Git, existing and symlinked parents',()=>{
  const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'cf-creature-bridge-test-')));temporary.push(parent);
  expect(assertCreatureBlenderOutputDirectory(path.join(parent,'new'))).toBe(path.join(parent,'new'));
  expect(()=>assertCreatureBlenderOutputDirectory(parent)).toThrow(/new directory/);
  expect(()=>assertCreatureBlenderOutputDirectory(path.join(root,'.git','new'))).toThrow(/source\/Git/);
  expect(()=>assertCreatureBlenderOutputDirectory(path.join(root,'audits','new'))).toThrow(/source\/Git/);
  fs.symlinkSync(parent,path.join(parent,'link'),'dir');
  expect(()=>assertCreatureBlenderOutputDirectory(path.join(parent,'link','new'))).toThrow(/real existing parent/);
});
