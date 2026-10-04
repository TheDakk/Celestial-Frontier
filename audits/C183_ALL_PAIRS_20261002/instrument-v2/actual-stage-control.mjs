/** PREPARED, NOT EXECUTED during C184. Real loaded Crab rigs; no browser/GPU. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {registerHooks} from 'node:module';
import {resolve} from '../../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';registerHooks({resolve});
import {probeTurnAtLocalTime,requireExactLaunchProbe} from './local-beat-probe.mjs';
const {loadFit}=await import('../../../port/v2/apps/game/src/battle2/parts-rig.fixtures.ts');
const {BattleStage,turnPlanInputFromTranscriptEvent}=await import('../../../port/v2/apps/game/src/battle2/stage.ts');
const {composeArena}=await import('../../../port/v2/apps/game/src/battle2/arena.ts');
const {placeCombatants}=await import('../../../port/v2/apps/game/src/battle2/placement.ts');
const {compileAnatomyAttack}=await import('../../../port/v2/apps/game/src/anatomy-attacks.ts');
const {parseEffectSequenceAnchors}=await import('../../../port/v2/apps/game/src/effects/anchors.ts');
const base='audits/C183_ALL_PAIRS_20261002',c=JSON.parse(fs.readFileSync(base+'/retained-first-pair/case.json')),prior=JSON.parse(fs.readFileSync(base+'/retained-first-pair/report.json')),recipe=JSON.parse(fs.readFileSync(c.arena.recipe)),parsed=parseEffectSequenceAnchors(JSON.parse(fs.readFileSync(c.effectAnchors)));assert(parsed.ok);
class Node{constructor(){this.x=0;this.y=0;this.rotation=0;this.alpha=1;this.visible=true;this.children=[];this.scale={x:1,y:1,set:(x,y)=>{this.scale.x=x;this.scale.y=y;}};this.anchor={set(){}};}addChild(c){this.children.push(c);}removeChild(c){this.children=this.children.filter(v=>v!==c);}destroy(){}clear(){}rect(){}fill(){}}
const nodes=[],node=()=>{const n=new Node();nodes.push(n);return n;},factory={container:node,sprite:node,text:node,graphics:node},frame={width:1024,height:576},tex={width:1672,height:941};
const left=await loadFit('crab'),right=await loadFit('crab'),masses={left:left.card.massClass.multiplier,right:right.card.massClass.multiplier},layout=composeArena({id:'exact-local-control',groundLineNormalized:recipe.groundLineNormalized,plates:{far:tex,mid:tex,near:tex}},frame),placed=placeCombatants({contextId:c.script.contextId,seed:recipe.seed,layout,worlds:{home:c.script.world,visitor:c.script.world},left:{rig:left.rig,mass:masses.left,record:left.record,genome:null,label:'Crab'},right:{rig:right.rig,mass:masses.right,record:right.record,genome:null,label:'Crab'}});assert.equal(placed.status,'READY');
let clock=0,current=-1,segment=-1,distortMs=0;const stage=new BattleStage({factory,clock:()=>clock,layout:placed.layout,plates:{far:tex,mid:tex,near:tex},rigs:{left:left.rig,right:right.rig},masses,...(placed.presentationScales?{presentationScales:placed.presentationScales}:{}),...(placed.water?{water:placed.water}:{}),plateMedium:recipe.medium??'ground'});
const ctx={A:{side:'A',name:c.script.labels.A,mass:masses.left,card:left.card,theme:'wild',seed:1},B:{side:'B',name:c.script.labels.B,mass:masses.right,card:right.card,theme:'wild',seed:2},arena:{groundLineY:layout.groundLineY,stands:placed.layout.stands,halfWidths:stage.halfWidths()},seed:recipe.seed,anchorsForTheme:()=>parsed.anchors,readyMs:c.script.readyMs,commandMs:c.script.commandMs,attackFor(side,ordinal){const s=side==='A'?left:right,r=compileAnatomyAttack(s.card,c.mediums[side==='A'?'left':'right'],ordinal);return{verb:r.attack.verb,timeline:r.timeline,contactMs:r.contactMs,contactJoint:r.attack.contactJoint};}};
const ord={A:0,B:0},turns=c.script.rows.map(row=>{const r=turnPlanInputFromTranscriptEvent(row,ctx,ord[row.side]++);assert.equal(r.kind,'turn');return r.input;}),plans=turns.map(t=>{clock=0;return stage.play(t);});
const contact=(side,joint)=>{const r=side==='left'?left.rig:right.rig,h=nodes.find(n=>n.children.includes(r.root)),j=r.jointPosition(joint);assert(h&&j);return{x:(h.x+h.scale.x*(j.x-r.foot.x*r.cutout.width))/frame.width,y:(h.y+h.scale.y*(j.y-r.foot.y*r.cutout.height))/frame.height};};
const restore=()=>{clock=0;current=-1;segment=-1;stage.play(turns[0]);current=0;segment=0;const f=stage.tick();return{turn:current,segment,clockMs:clock,sampledLocalMs:f.sample.ms};};
const options=i=>({stage,setClock:ms=>{clock=ms+(ms===0?0:distortMs);},turn:turns[i],turnIndex:i,expectedPlan:plans[i],localMs:plans[i].beats.actionStart,expectedActionId:'melee:'+plans[i].attack.verb,read:()=>contact(plans[i].attacker.side,plans[i].attack.contactJoint),restore});
const rows=[];
try{
 for(const i of [0,1,2,3,4,4,3,2,1,0]){assert.equal(plans[i].beats.actionStart,prior.gates.turns[i].beats.actionStart);const p=probeTurnAtLocalTime(options(i)),t={...prior.gates.turns[i],contactAtLaunch:p.value};requireExactLaunchProbe(p,t,i);const q=plans[i].effect.anchoring.launchPoint;assert(Math.abs(q.x-p.value.x)<1e-6&&Math.abs(q.y-p.value.y)<1e-6);rows.push({turn:i,probe:p});}
 for(const delta of [-.1,.1]){distortMs=delta;assert.throws(()=>probeTurnAtLocalTime(options(1)),/sampled local time differs/);assert.equal(clock,0);assert.equal(segment,0);}distortMs=0;
 const p=probeTurnAtLocalTime(options(0)),q=plans[0].effect.anchoring.launchPoint;assert.throws(()=>assert(Math.abs(q.y-(p.value.y+.01))<1e-6));
 // Restoration returns to the real ordinary stage pose, not just matching metadata.
 const after=contact(plans[0].attacker.side,plans[0].attack.contactJoint);clock=0;stage.play(turns[0]);stage.tick();assert.deepEqual(contact(plans[0].attacker.side,plans[0].attack.contactJoint),after);
 assert.equal(left.rig.refusals(),0);assert.equal(right.rig.refusals(),0);
 fs.writeFileSync(base+'/instrument-v2/actual-stage-controls.json',JSON.stringify({status:'PASS',scope:'Actual BattleStage with two real Crab fits and independent drawn joints; no browser/GPU/native',rows},null,2)+'\n',{flag:'wx'});console.log('Actual stage controls PASS');
}finally{stage.dispose();}
