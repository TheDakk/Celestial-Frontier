/** Source support/owner checks, not a taxonomic classifier or anatomical width ruler. */
import {createHash} from 'node:crypto';
import {familyContract} from './family-contracts.mjs';
import {resolveAnatomyInventory} from './anatomy-inventory.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function validateAnchoredMaterialSource(author,rgba,width,height,presence){
 if(!['anchored-soft-polyp','anchored-skeleton-soft-polyps'].includes(author?.family))return null;
 const need=(ok,m)=>{if(!ok)throw Error('Anchored material source: '+m);};
 need(rgba?.length===width*height*4&&width>0&&height>0,'source dimensions');const d=author.sourceMaterial;
 need(d?.schema==='cf.anchored-source-material/v1'&&d.rgbaSha256===sha(rgba),'exact source RGBA declaration');
 const spec=resolveAnatomyInventory(familyContract(author.family),presence),inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;},fields=[];
 need(Object.keys(author.landmarksPx).length===spec.joints.length,'exact source control inventory');
 for(const joint of spec.joints){const p=author.landmarksPx[joint];need(Array.isArray(p)&&p.length===2&&p.every(Number.isFinite),joint+' source landmark');const[x,y]=p.map(Math.floor);need(x>=0&&x<width&&y>=0&&y<height&&rgba[(y*width+x)*4+3]>0,joint+' positive actual source paint');if(joint==='root'||/^polyp\d+Base$/.test(joint))continue;const owner=author.parts.find(p=>inside(x+.5,y+.5,p.polygonPx));need(owner?.joint===joint,joint+' observed material owner');fields.push({joint,pixel:p,owner:owner.id,alpha:rgba[(y*width+x)*4+3]});}
 need(author.parts.length<=32,'unchanged32 render part budget');
 if(author.family==='anchored-skeleton-soft-polyps'){const n=presence.appendages?.polypFields;need(Number.isInteger(n)&&author.parts.length===n+1&&author.parts.filter(p=>/^polyp\d+Tip$/.test(p.joint)).length===n,'explicit source crown field inventory');}
 return{schema:'cf.anchored-material-source/v1',status:'PASS',family:author.family,sourceRgbaSha256:d.rgbaSha256,fields,scope:'Hash-bound observed source field ownership only; aggregate controls are not an individual tentacle/polyp biological census. No hidden paint or native acceptance.',nativeAcceptance:false};
}
