/** Authoring-only draw-prefix replay. A fresh canvas is read once per prefix,
 * avoiding repeated readbacks that change native Canvas2D rasterization. */
import {createSpeciesCanvas,type ArtContext2D} from './speciescanvas.js';
type Replay=(c:ArtContext2D,objects:Map<number,unknown>)=>void;
const readers=new WeakMap<ArtContext2D,()=>Uint8ClampedArray>();
const verifiers=new WeakMap<ArtContext2D,()=>{method:'fresh-prefix-canvas';prefixReads:number;differentChannels:number}>();
const methods=new Set(['save','restore','translate','rotate','scale','transform','setTransform','resetTransform','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','arc','arcTo','ellipse','rect','roundRect','fill','stroke','clip','clearRect','fillRect','strokeRect','setLineDash','drawImage']);
const queries=new Set(['getTransform','getLineDash','measureText','isPointInPath','isPointInStroke']);
export function recordPainterPrefixes(source:ArtContext2D,initial:{unclipped:true;emptyPath:true;saveDepth:0}){
 if(initial?.unclipped!==true||initial.emptyPath!==true||initial.saveDepth!==0)throw Error('Painter prefix: unknown initial path/clip/stack');
 const steps:Replay[]=[],ids=new WeakMap<object,number>();let serial=0,prefixReads=0;
 const m=source.getTransform();steps.push(c=>c.setTransform(m));
 const properties=['fillStyle','strokeStyle','globalAlpha','globalCompositeOperation','lineWidth','lineCap','lineJoin','miterLimit','lineDashOffset','shadowBlur','shadowColor','shadowOffsetX','shadowOffsetY','font','textAlign','textBaseline','direction','filter','imageSmoothingEnabled','imageSmoothingQuality','fontKerning','fontStretch','fontVariantCaps','letterSpacing','wordSpacing','textRendering'];
 for(const key of properties){const value=Reflect.get(source,key,source);if(value===undefined)continue;if(!['string','number','boolean'].includes(typeof value))throw Error('Painter prefix: unsupported inherited state '+key);steps.push(c=>{Reflect.set(c,key,value,c);});}
 const dash=source.getLineDash().slice();steps.push(c=>c.setLineDash(dash));
 const resolve=(value:unknown,objects:Map<number,unknown>):unknown=>value!==null&&typeof value==='object'&&ids.has(value)?objects.get(ids.get(value)!):value;
 const context=new Proxy(source,{get(target,key){
  const value=Reflect.get(target,key,target);if(typeof value!=='function')return value;
  if(typeof key!=='string')throw Error('Painter prefix: symbol method');
  if(queries.has(key))return value.bind(target);
  if(key==='createLinearGradient'||key==='createRadialGradient')return(...args:unknown[])=>{
   const gradient=Reflect.apply(value,target,args) as CanvasGradient,id=++serial;ids.set(gradient,id);
   steps.push((c,objects)=>objects.set(id,Reflect.apply(Reflect.get(c,key,c),c,args)));
   const add=gradient.addColorStop.bind(gradient);
   gradient.addColorStop=(offset:number,color:string)=>{add(offset,color);steps.push((_,objects)=>(objects.get(id) as CanvasGradient).addColorStop(offset,color));};
   return gradient;
  };
  if(!methods.has(key))throw Error('Painter prefix: unsupported method '+key);
  return(...args:unknown[])=>{const result=Reflect.apply(value,target,args);steps.push((c,objects)=>Reflect.apply(Reflect.get(c,key,c),c,args.map(v=>resolve(v,objects))));return result;};
 },set(target,key,value){const ok=Reflect.set(target,key,value,target);if(ok)steps.push((c,objects)=>{Reflect.set(c,key,resolve(value,objects),c);});return ok;}});
 const read=()=>{
  prefixReads++;
  const canvas=createSpeciesCanvas(source.canvas.width,source.canvas.height),c=canvas.getContext('2d');if(!c)throw Error('Painter prefix: context unavailable');
  try{const objects=new Map<number,unknown>();for(const step of steps)step(c,objects);return c.getImageData(0,0,canvas.width,canvas.height).data;}finally{canvas.width=0;canvas.height=0;}
 };
 readers.set(context,read);
 verifiers.set(context,()=>{const replay=read(),original=source.getImageData(0,0,source.canvas.width,source.canvas.height).data;let differentChannels=0;for(let i=0;i<original.length;i++)if(original[i]!==replay[i])differentChannels++;if(differentChannels)throw Error('Painter prefix: changed final RGBA '+differentChannels);return {method:'fresh-prefix-canvas',prefixReads,differentChannels};});
 return {context,close:()=>{readers.delete(context);verifiers.delete(context);}};
}
export function readPainterPrefix(context:ArtContext2D):Uint8ClampedArray{
 const read=readers.get(context);if(!read)throw Error('Painter prefix: capture requires recorded source');return read();
}

export function verifyPainterPrefix(context:ArtContext2D){const verify=verifiers.get(context);if(!verify)throw Error('Painter prefix: missing verifier');return verify();}
