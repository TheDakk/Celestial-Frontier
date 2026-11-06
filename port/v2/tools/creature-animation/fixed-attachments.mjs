/** Source-authored fixed sockets carry no pose channel or extra joint. */
const MODEL='myriapod-rigid-trunk-v1',INSECT_MODEL='insect-observed-sockets-v1';
const INSECT_LEGS=['legFrontFar','legFrontNear','legMidFar','legMidNear','legHindFar','legHindNear'];
const need=(ok,reason)=>{if(!ok)throw Error('Fixed attachments: '+reason);};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.getPrototypeOf({}),null].includes(Object.getPrototypeOf(v));
const exact=(v,keys)=>Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function expected(definition){
 if(definition?.anatomyModel===INSECT_MODEL){
  need(definition.id==='insect','unsupported anatomy model');
  const parents=new Map(definition.graph),legs=definition.legs;
  need(Array.isArray(legs)&&legs.length===6&&new Set(legs).size===6&&INSECT_LEGS.every(id=>legs.includes(id)&&parents.get(id+'Knee')==='thorax'&&parents.get(id+'Foot')===id+'Knee'),'insect walking socket graph mismatch');
  return legs.map(id=>id+'Knee');
 }
 need(definition?.id==='myriapod'&&definition.anatomyModel===MODEL,'unsupported anatomy model');
 need(Array.isArray(definition.graph)&&Array.isArray(definition.legs)&&definition.legs.length>0,'compact graph and walking legs required');
 const parents=new Map(definition.graph),legs=definition.legs;
 need(new Set(legs).size===legs.length&&legs.every(id=>typeof id==='string'&&/^leg\d+(Far|Near)$/.test(id)&&parents.get(id+'Knee')==='root'&&parents.get(id+'Foot')===id+'Knee'),'walking socket graph mismatch');
 need(parents.get('head')==='root','head socket graph mismatch');
 const ultimate=['ultimateFar','ultimateNear'].filter(id=>parents.has(id));
 need(ultimate.length===0||(ultimate.length===2&&ultimate.every(id=>parents.get(id)==='root')),'ultimate socket graph mismatch');
 return ['head',...legs.map(id=>id+'Knee'),...ultimate];
}
function checked(points,keys){
 need(object(points)&&exact(points,keys),'exact socket inventory required');
 return Object.freeze(Object.fromEntries(keys.map(key=>{const p=points[key];need(Array.isArray(p)&&p.length===2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p.every(n=>n>=0&&n<=1),'normalized finite socket required: '+key);return[key,Object.freeze([p[0],p[1]])];})));
}
/** Standalone skeleton/measurement consumers validate the resolved definition.
 * A compact model cannot silently use a parent landmark when sockets are absent. */
export function validateFixedPivots(definition){
 const has=!!definition&&Object.hasOwn(definition,'fixedPivots');
 if(![MODEL,INSECT_MODEL].includes(definition?.anatomyModel)){need(!has,'fixed pivots require compact myriapod or observed insect sockets');return null;}
 return checked(definition.fixedPivots,expected(definition));
}
/** Missing declaration/model returns the exact original definition. Compact
 * declarations are copied/frozen and match any already resolved pivot map.
 * Optional alpha checks the actual source pixel, not an inferred nearby point. */
export function resolveFixedAttachments(definition,record,alpha){
 const has=!!record?.geometry&&Object.hasOwn(record.geometry,'fixedAttachments');
 // A present, exact six-socket source declaration opts an insect in. Undeclared
 // legacy insects return their original definition and parent-pivot behavior.
 if(definition?.id==='insect'&&definition.anatomyModel===undefined&&has)definition={...definition,anatomyModel:INSECT_MODEL};
 if(![MODEL,INSECT_MODEL].includes(definition?.anatomyModel)){need(!has&&!Object.hasOwn(definition??{},'fixedPivots'),'fixed attachments require compact myriapod or observed insect sockets');return definition;}
 const keys=expected(definition);need(has,'source socket declaration required');
 const points=checked(record.geometry.fixedAttachments,keys);
 if(Object.hasOwn(definition,'fixedPivots')){const old=checked(definition.fixedPivots,keys);need(keys.every(k=>old[k][0]===points[k][0]&&old[k][1]===points[k][1]),'resolved pivots differ from source sockets');}
 if(alpha!==undefined){const{width,height}=record.geometry;need(Number.isSafeInteger(width)&&width>0&&Number.isSafeInteger(height)&&height>0&&Number.isSafeInteger(width*height)&&alpha instanceof Uint8Array&&alpha.length===width*height,'source alpha dimensions');
  for(const key of keys){const p=points[key],x=Math.min(width-1,Math.floor(p[0]*width)),y=Math.min(height-1,Math.floor(p[1]*height));need(alpha[y*width+x]>0,'socket outside painted alpha: '+key);}
 }
 // Dorsal observed sockets place feet on either side of the torso. Retract
 // each swing toward its own socket; the two existing translated reactions
 // use two complete steps, including tame's blended return to rest.
 return Object.freeze({...definition,fixedPivots:points,...definition.anatomyModel===INSECT_MODEL?{contactStance:{...definition.contactStance,swingLift:'toward-socket',travelSubsteps:{hit:2,tame:2}}}:{}});
}
