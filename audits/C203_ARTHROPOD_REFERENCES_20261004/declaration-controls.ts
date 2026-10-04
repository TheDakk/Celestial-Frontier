import fs from'node:fs';import assert from'node:assert/strict';
import{createFamilyContactSolver}from'../../port/v2/apps/game/src/creature-rig-contact.ts';
const[fit,out]=process.argv.slice(2),r=JSON.parse(fs.readFileSync(fit+'/record.json','utf8')),rows=[];
for(const[name,value]of[
 ['null',null],['empty',{}],['array',[]],['one step',{hit:1,tame:2}],['three steps',{hit:3,tame:2}],['fractional',{hit:2.5,tame:2}],['string',{hit:'2',tame:2}],['missing return',{hit:2}],['extra undeclared dodge',{hit:2,tame:2,dodge:2}],['unknown action',{hit:2,tame:2,other:2}],['inherited',Object.create({hit:2,tame:2})],['symbol',{hit:2,tame:2,[Symbol('other')]:2}]
]as const){(globalThis as any).__CF_C203_STANCE={travelSubsteps:value};assert.throws(()=>createFamilyContactSolver(r),/invalid travel substeps declaration/);rows.push({name,status:'REFUSED_AS_REQUIRED'});}
(globalThis as any).__CF_C203_STANCE={swingLift:'down-always'};assert.throws(()=>createFamilyContactSolver(r),/invalid swing lift declaration/);rows.push({name:'invalid swing direction',status:'REFUSED_AS_REQUIRED'});
delete(globalThis as any).__CF_C203_STANCE;const solver=createFamilyContactSolver(r);assert.equal(solver.chains.length,6);assert.equal(solver.resolve({},{actionId:'idle',elapsedMs:0,durationMs:1000,realm:'land'}).contacts.length,6);rows.push({name:'valid exact six-socket declaration',status:'PASS'});
fs.writeFileSync(out,JSON.stringify({schema:'cf.c203-declaration-controls/v1',status:'PASS',rows,scope:'Audit-only stance mutants injected after exact source socket validation; original numerical guards untouched'},null,2)+'\n',{flag:'wx'});
