/** Track T1 — label-free anatomy verifier, slice 1: silhouette protrusion analysis.
 * Input: an alpha plane (any painted or generated creature, keyed) and the declared family template.
 * Method: the body core is the largest component that survives a template-scaled erosion; every
 * component of (alpha minus the dilated core) that touches the core is an appendage. Appendages are
 * measured (length along the core boundary normal, thickness, attachment side, bottom-reach) and
 * classified against the template's expectation (legs, head, tail, claws). Pure integer/float work,
 * deterministic, no model. Calibrated on masters whose counts are known; every threshold is a
 * recorded parameter, never a hidden constant. A verdict is REFUSE/ADMIT plus the evidence. */
import {erodeAlpha} from '../../../../tools/local-image-generation/kit-contact-math.mjs';

export const EXPECTED={
  quadruped:{legs:4,head:1,tail:[0,1]},hopper:{legs:4,head:1,tail:[0,1]},primate:{legs:2,head:1,tail:[0,1],arms:2},
  'biped-bird':{legs:2,head:1,tail:[0,1],wings:[0,2]},'flyer-membrane':{legs:2,head:1,wings:2},
  insect:{legs:6,head:1,antennae:[0,2]},arachnid:{legs:8,head:[0,1]},myriapod:{legs:[8,64],head:1},
  brachyuran:{legs:8,claws:2,head:0},'crustacean-clawed':{legs:8,claws:2,head:0},'crustacean-small':{legs:10,head:[0,1]},
  fish:{legs:0,head:1,fins:[2,8],tail:1},serpent:{legs:0,head:1,tail:1},cephalopod:{legs:0,arms:[6,10]},
};
const need=(ok,m)=>{if(!ok)throw Error(m);};
function components(mask,w,h){
  const label=new Int32Array(w*h).fill(-1),stack=new Int32Array(w*h),out=[];
  for(let s=0;s<w*h;s++){if(!mask[s]||label[s]>=0)continue;const id=out.length;let top=0,n=0,minx=w,maxx=-1,miny=h,maxy=-1,sx=0,sy=0;stack[top++]=s;label[s]=id;
    while(top){const i=stack[--top],x=i%w,y=(i-x)/w;n++;sx+=x;sy+=y;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
      for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(j>=0&&mask[j]&&label[j]<0){label[j]=id;stack[top++]=j;}}
    out.push({id,pixels:n,box:{x:minx,y:miny,width:maxx-minx+1,height:maxy-miny+1},cx:sx/n,cy:sy/n});}
  return {label,parts:out};
}
function dilate(mask,w,h,r){const inv=new Uint8Array(w*h);for(let i=0;i<w*h;i++)inv[i]=mask[i]?0:255;const e=erodeAlpha(inv,w,h,r);const out=new Uint8Array(w*h);for(let i=0;i<w*h;i++)out[i]=e[i]?0:1;return out;}
/** Analyse one silhouette. `coreFraction` scales the erosion radius by the silhouette's minor extent. */
export function analyseSilhouette(alpha,w,h,{coreFraction=.10,minAppendagePixels=12,solidAlpha=128}={}){
  need(alpha.length===w*h,'alpha shape');
  const solid=new Uint8Array(w*h);let n=0,minx=w,maxx=-1,miny=h,maxy=-1;for(let i=0;i<w*h;i++)if(alpha[i]>=solidAlpha){solid[i]=255;n++;const x=i%w,y=(i-x)/w;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;}
  need(n>0,'empty silhouette');const box={x:minx,y:miny,width:maxx-minx+1,height:maxy-miny+1};
  const r=Math.max(1,Math.min(32,Math.round(Math.min(box.width,box.height)*coreFraction)));
  const eroded=erodeAlpha(solid,w,h,r),cores=components(Uint8Array.from(eroded,v=>v?1:0),w,h);
  need(cores.parts.length>0,'no body core at radius '+r);
  const core=cores.parts.reduce((a,b)=>b.pixels>a.pixels?b:a);const coreMask=new Uint8Array(w*h);for(let i=0;i<w*h;i++)coreMask[i]=cores.label[i]===core.id?1:0;
  const grown=dilate(coreMask,w,h,r),body=new Uint8Array(w*h),rest=new Uint8Array(w*h);for(let i=0;i<w*h;i++){body[i]=solid[i]&&grown[i]?1:0;rest[i]=solid[i]&&!grown[i]?1:0;}
  const app=components(rest,w,h),appendages=[];
  const bodyBox=components(body,w,h).parts.reduce((a,b)=>b.pixels>a.pixels?b:a).box;
  for(const p of app.parts){if(p.pixels<minAppendagePixels)continue;
    // attachment: does it touch the body? and where (relative to the body box)
    let touch=0,ax=0,ay=0;for(let y=p.box.y;y<p.box.y+p.box.height;y++)for(let x=p.box.x;x<p.box.x+p.box.width;x++){const i=y*w+x;if(app.label[i]!==p.id)continue;for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(j>=0&&body[j]){touch++;ax+=x;ay+=y;break;}}
    if(!touch)continue;ax/=touch;ay/=touch;
    const length=Math.max(p.box.width,p.box.height),thickness=p.pixels/Math.max(1,length);
    const relX=(ax-bodyBox.x)/bodyBox.width,relY=(ay-bodyBox.y)/bodyBox.height;
    const reachesBelow=p.box.y+p.box.height>=bodyBox.y+bodyBox.height*.9;
    appendages.push({pixels:p.pixels,box:p.box,attach:{x:+ax.toFixed(1),y:+ay.toFixed(1),relX:+relX.toFixed(2),relY:+relY.toFixed(2)},length,thickness:+thickness.toFixed(1),reachesBelow,touch});
  }
  appendages.sort((a,b)=>a.attach.x-b.attach.x);
  return {box,coreRadius:r,corePixels:core.pixels,bodyBox,appendages};
}
/** Classify appendages for a template and compare with EXPECTED. Returns counts, verdict and the reasons. */
export function verifyAnatomy(alpha,w,h,templateId,options={}){
  const exp=EXPECTED[templateId];need(exp,'no expectation for template '+templateId);
  const a=analyseSilhouette(alpha,w,h,options);
  const legs=a.appendages.filter(p=>p.reachesBelow&&p.attach.relY>.35),other=a.appendages.filter(p=>!(p.reachesBelow&&p.attach.relY>.35));
  const counts={legs:legs.length,other:other.length,appendages:a.appendages.length};
  const range=v=>Array.isArray(v)?v:[v,v];const [lo,hi]=range(exp.legs);
  const reasons=[];if(counts.legs<lo||counts.legs>hi)reasons.push(`legs ${counts.legs} outside ${lo}-${hi}`);
  return {templateId,counts,expected:exp,verdict:reasons.length?'REFUSE':'ADMIT',reasons,analysis:a};
}
