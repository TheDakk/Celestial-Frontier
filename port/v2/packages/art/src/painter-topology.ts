import {appendageCounts} from '../../../tools/creature-animation/repeated-anatomy.mjs';
import type {ArtContext2D} from './speciescanvas.js';
import {createTopologyPartCapture} from './topology-part-capture.js';
/** Drawn feature inventory in the painter's own coordinate space. This is not
 * a fitted animation record: incomplete landmarks and hidden surfaces remain
 * explicit. A compiler must qualify it before producing a rig/part binding. */
export interface DrawnFeature {
 readonly id:string;
 readonly kind:'body'|'arm'|'tentacle'|'leg'|'wing'|'antenna'|'head'|'neck'|'mark'|'opening';
 readonly structureId?:string;
 readonly points:ReadonlyArray<readonly [number,number]>;
 readonly widths?:readonly number[];
 readonly curve?:'polyline'|'quadratic'|'cubic'|'ellipse';
 readonly layer:'far'|'near';
}
export interface PainterTopology {
 readonly schema:'cf.painter-topology/v1';
 readonly partMasks?:import('./painter-part-capture.js').PaintedPartMasks;
 readonly anatomy?:import('../../../tools/creature-animation/anatomy-inventory.mjs').AnatomyPresence;
 readonly ownerId:string;
 readonly family:string;
 readonly coordinateSize:number;
 /** Painter coordinates to the padded ink canvas; absent only for direct-owner observations. */
 readonly rasterFrame?:Readonly<{width:number;height:number;origin:readonly [number,number];scale:number}>;
 readonly materials:Readonly<{surface:string;paletteSource:string}>;
 readonly features:readonly DrawnFeature[];
 readonly unresolved:readonly string[];
}
export function structuralBodyCount(features:readonly DrawnFeature[]):number{return new Set(features.filter(f=>f.kind==='body').map(f=>f.structureId??f.id)).size;}
const sessions=new WeakMap<ArtContext2D,{value?:PainterTopology;captureParts?:boolean}>();
export function startTopologyPartCapture(context:ArtContext2D){return sessions.get(context)?.captureParts?createTopologyPartCapture(context):undefined;}
export function isObservingPainterTopology(context:ArtContext2D):boolean{return sessions.has(context);}
export function emitPainterTopology(context:ArtContext2D,value:PainterTopology):void{
 const state=sessions.get(context);if(!state)return;
 if(state.value)throw Error('Painter topology: more than one winning owner');
 if(value.schema!=='cf.painter-topology/v1'||!value.ownerId||!value.family||!Number.isFinite(value.coordinateSize)||value.coordinateSize<=0||!value.materials.surface)throw Error('Painter topology: owner/space/material');
 const ids=new Set<string>();
 for(const f of value.features){
  if(!['body','arm','tentacle','leg','wing','antenna','head','neck','mark','opening'].includes(f.kind)||f.structureId!==undefined&&(!f.structureId||f.kind==='mark')||!f.id||ids.has(f.id)||!['far','near'].includes(f.layer)||!f.points.length||f.points.some(p=>p.length!==2||!p.every(Number.isFinite))||f.widths?.some(w=>!Number.isFinite(w)||w<=0))throw Error('Painter topology: feature geometry');
  ids.add(f.id);
 }
 const counts=appendageCounts(value.family,value.anatomy);
 if(counts&&'walkingLegPairs' in counts){
  const expected=[...Array.from({length:counts.walkingLegPairs},(_,i)=>['leg'+i+'Far','leg'+i+'Near']).flat(),'ultimateFar','ultimateNear'];
  const actual=value.features.filter(f=>f.kind==='leg');
  if(actual.length!==expected.length||!expected.every(id=>actual.some(f=>f.id===id)))throw Error('Painter topology: count/feature mismatch leg');
 }else if(counts){
  for(const [kind,prefix,count]of [['arm','arm',counts.arms],['tentacle','tentacle',counts.feedingTentacles]]as const){
   const actual=value.features.filter(f=>f.kind===kind);
   if(actual.length!==count||!Array.from({length:count},(_,i)=>prefix+i).every(id=>actual.some(f=>f.id===id)))throw Error('Painter topology: count/feature mismatch '+kind);
  }
 }
 state.value=structuredClone(value);
}
/** Scope is synchronous to the winning draw. Always clears after failure;
 * unsupported owners return null and can never become a guessed quadruped. */
export function observePainterTopology(context:ArtContext2D,paint:()=>void,options:{captureParts?:boolean}={}):PainterTopology|null{
 if(sessions.has(context))throw Error('Painter topology: nested owner capture');
 const state:{value?:PainterTopology;captureParts?:boolean}={captureParts:options.captureParts??false};sessions.set(context,state);
 try{paint();return state.value??null;}finally{sessions.delete(context);}
}
