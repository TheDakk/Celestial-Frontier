/** Explicit adhesive pad anchors in normalized master-pixel space.
 * This validates declarations, not terminal skin eligibility or ground clearance.
 * The latter is not claimed: an adhesive point need not share a floor with another foot.
 */
const need=(ok,reason)=>{if(!ok)throw Error('Terminal contact pads: '+reason);};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
 &&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const exactKeys=(value,expected)=>Reflect.ownKeys(value).length===expected.length
 &&expected.every(key=>Object.hasOwn(value,key));

/** Missing own contactPads property leaves legacy admission untouched. A present
 * declaration must be complete. Alpha is optional for sealing, mandatory when
 * the caller admits the source image. Pixel cells use floor(point * dimension),
 * with the normalized closed edge 1 assigned to the last cell. There is no
 * neighborhood search, alpha cutoff, automatic point inference, or mutation.
 */
export function validateTerminalContactPads(record,chains,alpha){
 const geometry=record?.geometry;
 if(!geometry||!Object.hasOwn(geometry,'contactPads'))return undefined;
 const declaration=geometry.contactPads;
 need(object(declaration),'declaration object required');
 need(exactKeys(declaration,['schema','kind','points']),'exact declaration fields required');
 need(declaration.schema==='cf.terminal-pad-support/v1','unsupported schema');
 need(declaration.kind==='adhesive','unsupported kind');
 need(object(declaration.points),'points object required');
 need(Array.isArray(chains)&&chains.length>0,'contact chains required');
 need(chains.every(chain=>chain&&typeof chain.end==='string'&&chain.end.length>0
  &&typeof chain.terminal==='string'&&chain.terminal.length>0&&chain.terminal!==chain.end),'terminal chain required');
 const names=chains.map(chain=>chain.end);
 need(new Set(names).size===names.length,'duplicate contact chain');
 need(exactKeys(declaration.points,names),'exact contact point inventory required');
 const {width,height}=geometry;
 need([width,height].every(n=>Number.isSafeInteger(n)&&n>0)&&Number.isSafeInteger(width*height),'source dimensions');
 if(alpha!==undefined)need(alpha instanceof Uint8Array&&alpha.length===width*height,'alpha dimensions or type');
 const entries=names.map(name=>{
  const point=declaration.points[name];
  need(Array.isArray(point)&&point.length===2&&Number.isFinite(point[0])&&Number.isFinite(point[1]),'finite point required: '+name);
  need(point.every(n=>n>=0&&n<=1),'point outside source: '+name);
  if(alpha!==undefined){
   const x=Math.min(width-1,Math.floor(point[0]*width)),y=Math.min(height-1,Math.floor(point[1]*height));
   need(alpha[y*width+x]>0,'point outside painted alpha: '+name);
  }
  return [name,Object.freeze([point[0],point[1]])];
 });
 return Object.freeze({schema:declaration.schema,kind:declaration.kind,points:Object.freeze(Object.fromEntries(entries))});
}
