/** Bounded one-view quadruped proof. The record owns anatomy; this module owns
 * topology, inherited affine skinning and shared finite curves. No species,
 * genes, asset paths, renderer, clock or per-creature clip overrides. */
import { composeAffine, rotationAround, createTwoBoneChain, IDENTITY_AFFINE } from './kinematics.ts';
export const TEMPLATE = Object.freeze({ id:'quadruped', version:1, clipSetId:'quadruped-land-v1',
  clips:Object.freeze({rest:0,idle:3000,attack:2200,hit:1300}), layers:Object.freeze(['far','near']) });
export const LEGS = Object.freeze(['hindFar','foreFar','hindNear','foreNear']);
export const GRAPH = Object.freeze([
  ['pelvis','root'],['spine','pelvis'],['chest','spine'],['neck','chest'],['head','neck'],['jaw','head'],
  ...LEGS.flatMap(id=>[[id+'Root',id.startsWith('hind')?'pelvis':'chest'],[id+'Knee',id+'Root'],[id+'Ankle',id+'Knee'],[id+'Paw',id+'Ankle']]),
  ['tail0','pelvis'],['tail1','tail0'],['tail2','tail1'],['tail3','tail2'],
  ['earFarRoot','head'],['earFarTip','earFarRoot'],['earNearRoot','head'],['earNearTip','earNearRoot']
].map(Object.freeze));
const names = ['root',...GRAPH.map(b=>b[0])], length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const assert=(ok,msg)=>{if(!ok)throw Error('Quadruped admission: '+msg);};
export const stableJSON = x => JSON.stringify(x,(_,v)=>v && !Array.isArray(v) && typeof v==='object'
  ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])) : v);
export async function hashBytes(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export const hashJSON = x => hashBytes(new TextEncoder().encode(stableJSON(x)));
export function checkGeometry(record, alpha){
  assert(record.template.id===TEMPLATE.id && record.template.version===1 && record.kind==='quadruped','unsupported body or template');
  assert(record.clipSetId===TEMPLATE.clipSetId && !('clipOverrides' in record),'shared clip set required');
  const j=record.landmarks,{width:w,height:h}=record.geometry;
  assert(Number.isInteger(w)&&Number.isInteger(h)&&w>=128&&h>=128&&w<=2048&&h<=2048,'input dimensions');
  assert(Object.keys(j).length===names.length && names.every(n=>Array.isArray(j[n])&&j[n].length===2&&j[n].every(v=>Number.isFinite(v)&&v>=0&&v<=1)),'joint inventory / normalized coordinates');
  const torso=length(j.pelvis,j.chest),head=length(j.neck,j.head);
  assert(torso>=.08&&torso<=.65&&head>=.015&&head<=torso*1.6,'torso / head proportion bounds');
  const bones=Object.fromEntries(GRAPH.map(([n,p])=>[n,length(j[n],j[p])]));
  assert(Object.values(bones).every(n=>n>=.001&&n<=.75),'degenerate or excessive bone');
  for(const id of LEGS){const total=['Knee','Ankle','Paw'].reduce((s,n)=>s+bones[id+n],0);assert(total/torso>=.25&&total/torso<=2.7,'leg proportions');}
  assert(Number.isFinite(record.geometry.groundLineY)&&record.geometry.groundLineY>0&&record.geometry.groundLineY<=1,'ground line');
  assert(record.geometry.depthLayers.length===2 && record.geometry.depthLayers.every((l,i)=>l.id===TEMPLATE.layers[i]&&l.order===i),'two depth layers');
  if(alpha){
    assert(alpha.length===w*h,'alpha dimensions');
    for(const n of names){const [x,y]=j[n];let found=false;
      // Joint axes may be hidden within overlapping fur; tolerate 1.2% only.
      const r=Math.ceil(Math.max(w,h)*.012),xx=Math.round(x*w),yy=Math.round(y*h);
      for(let dy=-r;dy<=r&&!found;dy++)for(let dx=-r;dx<=r;dx++)if(xx+dx>=0&&yy+dy>=0&&xx+dx<w&&yy+dy<h&&alpha[(yy+dy)*w+xx+dx]>12){found=true;break;}
      assert(found,'landmark outside painted alpha: '+n);
    }
  }
  return {inside:true,clamped:[],boneLengths:bones};
}
export async function sealRecord(input){const record=structuredClone(input);record.boundsCheck=checkGeometry(record);record.recipeHash=await hashJSON(record);return record;}
export async function admitRecord(record,cutoutBytes,alpha){
  const {recipeHash,...body}=record;
  assert(await hashJSON(body)===recipeHash,'corrupted landmark / recipe hash');
  assert(await hashBytes(cutoutBytes)===record.geometry.cutoutAssetHash,'mismatched cut-out hash');
  assert(typeof record.identity.speciesVisualKey==='string'&&record.identity.speciesVisualKey.length>5&&Number.isInteger(record.identity.seed)&&record.identity.ownerId,'identity');
  assert(stableJSON(checkGeometry(record,alpha))===stableJSON(record.boundsCheck),'stale bounds / lengths');
  return true;
}
/** Adaptive alpha quadtree → conforming triangle fans. Boundary cells refine to
 * 4px, solid interior to 32px; empty cells disappear. All leaf-edge vertices are
 * shared, including fine/coarse junctions. No disconnected strips or T-junctions. */
export function triangulateAlpha(alpha,w,h){
  assert(alpha.length===w*h && w>0&&h>0,'triangulation dimensions');
  const stride=w+1,integral=new Uint32Array((w+1)*(h+1));
  for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){row+=alpha[y*w+x]>0?1:0;integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row;}}
  const count=(x,y,s)=>{const a=Math.min(w,x),b=Math.min(h,y),c=Math.min(w,x+s),d=Math.min(h,y+s);return integral[d*stride+c]-integral[b*stride+c]-integral[d*stride+a]+integral[b*stride+a];};
  const leaves=[];const split=(x,y,s)=>{const n=count(x,y,s);if(!n)return;if(s<=4||(n===s*s&&s<=32)){leaves.push([x,y,s]);return;}const k=s/2;split(x,y,k);split(x+k,y,k);split(x,y+k,k);split(x+k,y+k,k);};
  split(0,0,2**Math.ceil(Math.log2(Math.max(w,h))));assert(leaves.length>0,'empty alpha');
  const positions=[],lookup=new Map(),rows=new Map(),cols=new Map();
  const vertex=(x,y,edge=false)=>{const key=x+','+y;if(lookup.has(key))return lookup.get(key);const id=positions.length/2;lookup.set(key,id);positions.push(x,y);if(edge){if(!rows.has(y))rows.set(y,[]);rows.get(y).push(x);if(!cols.has(x))cols.set(x,[]);cols.get(x).push(y);}return id;};
  for(const [x,y,s]of leaves)for(const [a,b]of[[x,y],[x+s,y],[x+s,y+s],[x,y+s]])vertex(a,b,true);
  for(const list of [...rows.values(),...cols.values()])list.sort((a,b)=>a-b);
  const indices=[];
  for(const[x,y,s]of leaves){const rim=[...rows.get(y).filter(v=>v>=x&&v<x+s).map(v=>vertex(v,y)),...cols.get(x+s).filter(v=>v>=y&&v<y+s).map(v=>vertex(x+s,v)),...rows.get(y+s).filter(v=>v>x&&v<=x+s).reverse().map(v=>vertex(v,y+s)),...cols.get(x).filter(v=>v>y&&v<=y+s).reverse().map(v=>vertex(x,v))];
    const center=vertex(x+s/2,y+s/2);for(let i=0;i<rim.length;i++)indices.push(center,rim[i],rim[(i+1)%rim.length]);}
  const rest=new Float32Array(positions),uvs=Float32Array.from(positions,(v,i)=>v/(i%2?h:w));
  return {rest,vertices:rest.slice(),uvs,indices:new Uint32Array(indices),leaves:leaves.length};
}
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const track=(t,keys)=>{for(let i=1;i<keys.length;i++){const a=keys[i-1],b=keys[i];if(t<=b[0])return a[1]+(b[1]-a[1])*smooth((t-a[0])/(b[0]-a[0]));}return 0;};
export function sampleClip(clip,ms){
  assert(Object.hasOwn(TEMPLATE.clips,clip)&&Number.isFinite(ms)&&ms>=0,'finite clip');
  const rest={breath:0,drive:0,compress:0,flight:0,tail:0,ear:0,jaw:0};
  if(clip==='rest'||ms===0||ms>=TEMPLATE.clips[clip])return rest;
  const t=ms/TEMPLATE.clips[clip],env=Math.sin(Math.PI*t)**2;
  if(clip==='idle')return {...rest,breath:Math.sin(Math.PI*t)**2,drive:.02*env*Math.sin(2*Math.PI*t),tail:env*Math.sin(2*Math.PI*t),ear:env*Math.sin(6*Math.PI*t)**8};
  if(clip==='hit')return {...rest,drive:-.08*track(t,[[0,0],[.25,1],[.6,.15],[1,0]]),compress:env,tail:-env,ear:env,jaw:.2*env};
  const drive=track(t,[[0,0],[.22,-.10],[.37,-.05],[.58,1],[.7,.9],[1,0]]);
  const flight=track(t,[[0,0],[.32,0],[.5,1],[.65,.8],[.84,0],[1,0]]);
  return {...rest,drive,compress:Math.max(0,-drive)*5,flight,tail:-env,jaw:env,ear:env};
}
function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
/** Capsule weights use record bones, normalized once at binding. Like the old
 * articulated study, deltas blend continuously, feet lock and children inherit.
 * Matrix compose/IK primitives are the existing kinematics owner. */
export function createRig(record,alpha){
  checkGeometry(record,alpha);const {width:w,height:h}=record.geometry,mesh=triangulateAlpha(alpha,w,h);
  const j=Object.fromEntries(Object.entries(record.landmarks).map(([n,p])=>[n,[p[0]*w,p[1]*h]]));
  const segments=[['body','pelvis','chest'],['head','neck','head'],['jaw','head','jaw'],
    ...LEGS.flatMap(id=>[[id+'Upper',id+'Root',id+'Knee'],[id+'Lower',id+'Knee',id+'Ankle'],[id+'Foot',id+'Ankle',id+'Paw']]),
    ...[0,1,2].map(i=>['tail'+i,'tail'+i,'tail'+(i+1)]),['earFar','earFarRoot','earFarTip'],['earNear','earNearRoot','earNearTip']];
  const weights=new Float32Array(mesh.rest.length/2*segments.length),bodyLength=length(j.pelvis,j.chest);
  const locks=new Float32Array(mesh.rest.length/2),layerIndices=[[],[]];
  for(let v=0;v<mesh.rest.length/2;v++){
    const x=mesh.rest[v*2],y=mesh.rest[v*2+1];let sum=0;
    for(let i=0;i<segments.length;i++){const [id,a,b]=segments[i];const radius=id==='body'?bodyLength*.4:id==='head'?bodyLength*.3:id==='jaw'?bodyLength*.07:id.startsWith('ear')?bodyLength*.065:bodyLength*.085;
      const d=segmentDistance(x,y,j[a],j[b]);let weight=Math.exp(-d*d/(radius*radius));
      if(id==='jaw')weight*=.5;
      weights[v*segments.length+i]=weight;sum+=weight;
    }
    for(let i=0;i<segments.length;i++)weights[v*segments.length+i]/=sum||1;
    locks[v]=Math.max(...LEGS.map(id=>{const p=j[id+'Paw'];return smooth((y-(p[1]-bodyLength*.13))/(bodyLength*.08))*(1-smooth((Math.abs(x-p[0])-bodyLength*.07)/(bodyLength*.08)));}));
  }
  for(let k=0;k<mesh.indices.length;k+=3){const ids=Array.from(mesh.indices.subarray(k,k+3)),x=ids.reduce((a,i)=>a+mesh.rest[i*2],0)/3,y=ids.reduce((a,i)=>a+mesh.rest[i*2+1],0)/3;
    const distances=LEGS.map(id=>segmentDistance(x,y,j[id+'Root'],j[id+'Paw']));const nearest=distances.indexOf(Math.min(...distances));
    const layer=nearest<2&&Math.min(...distances)<bodyLength*.14?0:1;layerIndices[layer].push(...ids);
  }
  const chains=LEGS.map(id=>{const root=j[id+'Root'],joint=j[id+'Knee'],end=j[id+'Ankle'];const side=(end[0]-root[0])*(joint[1]-root[1])-(end[1]-root[1])*(joint[0]-root[0]);return createTwoBoneChain({root:{x:root[0],y:root[1]},joint:{x:joint[0],y:joint[1]},end:{x:end[0],y:end[1]},bend:side>=0?1:-1});});
  return {...mesh,record,j,segments,weights,locks,chains,bodyLength,layerIndices:layerIndices.map(a=>new Uint32Array(a)),matrices:new Float64Array(segments.length*6),ikRefusals:0};
}
export function applyPose(rig,pose){
  const {j,bodyLength:L,segments}=rig;const {breath,drive,compress,flight,tail,ear,jaw}=pose;
  assert(Object.values(pose).every(Number.isFinite),'nonfinite pose');
  if(Object.values(pose).every(v=>v===0)){rig.vertices.set(rig.rest);return;}
  const dx=L*.36*drive,dy=L*(.026*compress-.011*breath-.09*flight);
  const body=rotationAround({x:j.root[0],y:j.root[1]},-.006*drive,{x:dx,y:dy});
  const head=composeAffine(body,rotationAround({x:j.neck[0],y:j.neck[1]},-.024*drive-.009*breath));
  const matrices={body,head,jaw:composeAffine(head,rotationAround({x:j.head[0],y:j.head[1]},.027*jaw))};
  for(let k=0;k<LEGS.length;k++){
    const id=LEGS[k],root=j[id+'Root'],end=j[id+'Ankle'];
    // Feet release only during the shared attack's flight interval. Rest support
    // offsets (perspective or authored raised paw) are immutable record geometry.
    const move=flight>0?{x:dx,y:-L*.08*flight}:{x:0,y:0};
    let result;
    try{result=rig.chains[k].solve({x:root[0]+dx*.08,y:root[1]+Math.max(0,dy)},{x:end[0]+move.x*.08,y:end[1]+move.y*.08});}
    catch{rig.ikRefusals++;result=rig.chains[k].rest();}
    matrices[id+'Upper']=composeAffine(rotationAround({x:0,y:0},0,{x:dx*.8,y:dy*.5}),result.upperMatrix);
    matrices[id+'Lower']=result.lowerMatrix;matrices[id+'Foot']=rotationAround({x:0,y:0},0,move);
  }
  let parent=body;
  for(let i=0;i<3;i++){const pivot=j['tail'+i];parent=composeAffine(parent,rotationAround({x:pivot[0],y:pivot[1]},.025*tail*(1+i*.25)));matrices['tail'+i]=parent;}
  for(const id of ['earFar','earNear'])matrices[id]=composeAffine(head,rotationAround({x:j[id+'Root'][0],y:j[id+'Root'][1]},(id==='earFar'?-.09:.09)*ear));
  for(let i=0;i<segments.length;i++)rig.matrices.set(matrices[segments[i][0]]??IDENTITY_AFFINE,i*6);
  for(let v=0;v<rig.rest.length/2;v++){
    const x=rig.rest[v*2],y=rig.rest[v*2+1];let mx=0,my=0;
    for(let i=0;i<segments.length;i++){const wt=rig.weights[v*segments.length+i],o=i*6,b=rig.matrices;mx+=wt*(b[o]*x+b[o+2]*y+b[o+4]-x);my+=wt*(b[o+1]*x+b[o+3]*y+b[o+5]-y);}
    const lock=rig.locks[v];rig.vertices[v*2]=x+mx*(1-lock)+lock*(flight>0?dx:0);rig.vertices[v*2+1]=y+my*(1-lock)-lock*L*.08*flight;
  }
}
export function inspectShape(rig){let minRatio=Infinity,maxRatio=-Infinity,maxEdgeRatio=0;
  const area=(p,a,b,c)=>(p[b*2]-p[a*2])*(p[c*2+1]-p[a*2+1])-(p[b*2+1]-p[a*2+1])*(p[c*2]-p[a*2]);
  for(let k=0;k<rig.indices.length;k+=3){const [a,b,c]=rig.indices.subarray(k,k+3),ratio=area(rig.vertices,a,b,c)/area(rig.rest,a,b,c);minRatio=Math.min(minRatio,ratio);maxRatio=Math.max(maxRatio,ratio);
    for(const[u,v]of[[a,b],[b,c],[c,a]])maxEdgeRatio=Math.max(maxEdgeRatio,Math.hypot(rig.vertices[u*2]-rig.vertices[v*2],rig.vertices[u*2+1]-rig.vertices[v*2+1])/Math.hypot(rig.rest[u*2]-rig.rest[v*2],rig.rest[u*2+1]-rig.rest[v*2+1]));}
  return {minRatio,maxRatio,maxEdgeRatio,holdsShape:minRatio>.12&&maxRatio<4&&maxEdgeRatio<2.5};
}
