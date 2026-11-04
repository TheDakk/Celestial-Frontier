/** Narrow authored-source guard for an observed soft axial body. It proves source support
 * and terminal ownership; it is not a species classifier or an anatomy replacement. */
export function validateSoftAxialSource(author,rgba,width,height){
 if(!['axial-soft-worm','errant-soft-worm'].includes(author?.family))return null;
 const need=(ok,message)=>{if(!ok)throw Error('Soft axial source: '+message);};
 need(Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0&&rgba?.length===width*height*4,'finite source RGBA dimensions');
 const inside=(x,y,polygon)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
 }return yes;};
 const terminals=[];for(const joint of['anterior','posterior']){
  const point=author.landmarksPx?.[joint];need(Array.isArray(point)&&point.length===2&&point.every(Number.isFinite),joint+' source support landmark');
  const[x,y]=point.map(Math.floor);need(x>=0&&x<width&&y>=0&&y<height&&rgba[(y*width+x)*4+3]>0,joint+' source support at observed landmark');
  const owner=author.parts?.find(p=>inside(x+.5,y+.5,p.polygonPx));need(owner?.joint===joint,joint+' owner must retain the observed terminal source cap');
  terminals.push({joint,point,part:owner.id,positiveSourceAlpha:rgba[(y*width+x)*4+3]});
 }
 need(terminals[0].part!==terminals[1].part,'distinct observed terminal owners');
 const fields=[];
 if(author.family==='errant-soft-worm')for(const joint of [...Array.from({length:7},(_,i)=>['bristleFar'+i,'bristleNear'+i]).flat(),...['Upper','Lower'].flatMap(side=>['palp'+side+'Base','palp'+side+'Tip'])]){
  const point=author.landmarksPx?.[joint];need(Array.isArray(point)&&point.length===2&&point.every(Number.isFinite),joint+' source support landmark');
  const[x,y]=point.map(Math.floor);need(x>=0&&x<width&&y>=0&&y<height&&rgba[(y*width+x)*4+3]>0,joint+' source support at observed landmark');
  const owner=author.parts?.find(p=>inside(x+.5,y+.5,p.polygonPx));need(owner?.joint===joint,joint+' must retain its observed palp or bristle/parapodial source field');
  fields.push({joint,point,part:owner.id,positiveSourceAlpha:rgba[(y*width+x)*4+3]});
 }
 return{fields,schema:'cf.soft-axial-source/v1',status:'PASS',terminals,scope:'source support and preserved authored terminal ownership only; no species classification, native acceptance or geometric ruler',nativeAcceptance:false};
}
