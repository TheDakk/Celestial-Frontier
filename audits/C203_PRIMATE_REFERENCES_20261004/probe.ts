import fs from 'node:fs';import assert from 'node:assert/strict';import{createRequire}from'node:module';
import{compileBodyCard,buildTimeline,createGsapPlayer}from'../../port/v2/apps/game/src/motion/index.ts';
import{withPaintedContactSupports}from'../../port/v2/apps/game/src/motion/painted-supports.ts';
import{familyContractForRecord}from'../../port/v2/tools/creature-animation/family-contracts.mjs';
import{preparePaintedSamples,posedPaintedY}from'../C202_PRIMATE_REFERENCES_20261004/painted-samples.mjs';
import{createPaintPublication}from'./paint-publication.mjs';import{createForehandSupport,convexHull}from'./forehand-support.ts';
import{createForehandHinge}from'./forehand-hinge.ts';
import{createSourceJoinProbe,assessSourceJoinContinuity}from'../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import{rasterPaint}from'../C132_FAINT_GROUND_20261002/render-mesh.mjs';
const {PNG}=createRequire(process.cwd()+'/port/v2/package.json')('pngjs'),B='audits/C203_PRIMATE_REFERENCES_20261004',J=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const [candidate,old,mode,outName,gainArg='1']=process.argv.slice(2);const gain=Number(gainArg);assert(Number.isFinite(gain)&&gain>=0&&gain<=1);assert(['baseline','source-only','support','hinge'].includes(mode));
const base='audits/C202_PRIMATE_REFERENCES_20261004/'+old,dir=B+'/'+candidate,fit=(mode==='baseline'?base:dir)+'/fit01',out=dir+'/'+outName;assert(!fs.existsSync(out));fs.mkdirSync(out);
const record=J(fit+'/record.json'),binding=J(fit+'/binding.json'),manifest=J(fit+'/parts/manifest.json'),atlas=PNG.sync.read(fs.readFileSync(fit+'/parts/atlas/'+manifest.creatureId+'.png'));
const joinProbe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.width,height:atlas.height}});
const oldBinding=J(base+'/fit01/binding.json'),oldManifest=J(base+'/fit01/parts/manifest.json'),oldAtlas=PNG.sync.read(fs.readFileSync(base+'/fit01/parts/atlas/'+oldManifest.creatureId+'.png'));
const joints=['armNearHand','armFarHand'],sourceHands=joints.map(j=>{
 const prepared=preparePaintedSamples(oldBinding,oldAtlas,oldBinding.parts.find((p:any)=>p.joint===j).id);
 const corners=prepared.samples.flatMap((s:any)=>[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>[s.x+x,s.y+y]));
 return {joint:j,hull:convexHull(corners),positiveTexels:prepared.positiveTexels};
});
const support=(mode==='hinge'?createForehandHinge:createForehandSupport)(record,familyContractForRecord(record),sourceHands),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),pub=createPaintPublication(record,binding,card.realm,['support','hinge'].includes(mode)?(p:any,phase:any)=>support.resolve(p,phase):null);
const prepared=joints.map(j=>preparePaintedSamples(binding,atlas,binding.parts.find((p:any)=>p.joint===j).id)),ground=record.geometry.groundLineY*record.geometry.height,tl=buildTimeline(card,'faint',record.identity.seed),rows:any[]=[];let pose:any={};
const player=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});
try{for(let i=0;i<=16;i++){
 pose={};const fraction=i/16;player.seek(tl.durationMs*fraction);for(const value of Object.values(pose) as any[])for(const key of ['rotation','dx','dy'])if(typeof value[key]==='number')value[key]*=gain;const phase={actionId:tl.actionId,elapsedMs:tl.durationMs*fraction,durationMs:tl.durationMs,weight:1,realm:card.realm,travel:'stage'};
 try{const result=pub.publish(pose,phase),hands=prepared.map(p=>posedPaintedY(p,result.positions,record.geometry.height,ground));
  rows.push({fraction,status:'PUBLISHED',hands,joins:assessSourceJoinContinuity(joinProbe,result.positions),forehand:result.forehand,contactError:result.contactError,paintTargetError:result.paintTargetError,resolved:result.resolved});
  if([0,8,16].includes(i))for(const facing of [1,-1])fs.writeFileSync(out+'/faint-'+i+(facing===1?'-right':'-left')+'.png',PNG.sync.write(rasterPaint(record,binding,atlas,result.positions,facing)),{flag:'wx'});
 }catch(e:any){rows.push({fraction,status:'REFUSED',error:e.message});}
}
fs.writeFileSync(out+'/result.json',JSON.stringify({schema:'cf.c203-primate-forehand-probe/v1',mode,gain,fit,sourceHands,scope:'Audit-only 17-sample pilot, conservative whole positive-alpha lower arm/hand bounds, source-coordinate pixels; not a native qualification.',rows,native:false,qualified:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,mode,gain,rows:rows.length,refusals:rows.filter(r=>r.status==='REFUSED').length,firstRefusal:rows.find(r=>r.status==='REFUSED'),worst:Math.max(0,...rows.flatMap(r=>(r.hands||[]).map((h:any)=>h.maximumBelowGuidePx)))}));
}finally{player.stop();}
