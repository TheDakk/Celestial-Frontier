import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,s)=>{if(!ok)throw Error('Post-key matte: '+s);};
const excess=(a,i,key)=>key==='magenta'?Math.max(0,Math.min(a[i*4],a[i*4+2])-a[i*4+1]):Math.max(0,a[i*4+1]-Math.max(a[i*4],a[i*4+2]));
/** A derivative, never a replacement for keyed intake. The existing classifier
 * is reused verbatim; only its morphology is removed AFTER the canonical seal.
 * Recovery traverses original source-supported pixels connected to retained
 * canonical paint. It cannot create a pixel in the classified key field, bridge
 * a source gap, or resurrect a source island erased entirely by canonical intake.
 * Explicit biological-pigment protection and canonical-fringe selections are
 * source-review recipe data, never a new universal colour/anatomy threshold. */
export function derivePostKeyMatte({originalRgba,canonicalRgba,width:w,height:h,canonicalRgbaSha256,keyColor='magenta',protectedPixels=[],despillPixels=[],donorExclusionPixels=[],donorExclusionSource}){
 need(Number.isSafeInteger(w)&&Number.isSafeInteger(h)&&w>0&&h>0&&originalRgba.length===w*h*4&&canonicalRgba.length===originalRgba.length,'dimensions');
 need(['magenta','green'].includes(keyColor),'key color');need(/^[a-f0-9]{64}$/.test(canonicalRgbaSha256??'')&&sha(canonicalRgba)===canonicalRgbaSha256,'changed canonical keyed RGBA');
 const originalHash=sha(originalRgba),n=w*h,support=new Uint8Array(n),connected=new Uint8Array(n),donor=new Int32Array(n),queue=new Int32Array(n),protectedSet=new Set(protectedPixels),fringeSet=new Set(despillPixels);
 for(const list of [protectedPixels,despillPixels]){need(Array.isArray(list)&&new Set(list).size===list.length,'duplicate or malformed selections');for(const i of list)need(Number.isInteger(i)&&i>=0&&i<n,'selection pixel');}for(const i of protectedSet)need(!fringeSet.has(i),'pigment protection conflicts with fringe');
 let tail=0;for(let i=0;i<n;i++){const[r,g,b,a]=originalRgba.subarray(i*4,i*4+4);need(a===255,'original must remain opaque');support[i]=(keyColor==='magenta'?r>150&&b>150:g>150)&&excess(originalRgba,i,keyColor)>85?0:255;if(canonicalRgba[i*4+3]){need(support[i],'canonical paint outside original classifier support');connected[i]=255;queue[tail++]=i;}}
 const neighbours=(i,visit)=>{const x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h)visit(yy*w+xx);}};
 for(let q=0;q<tail;q++)neighbours(queue[q],j=>{if(support[j]&&!connected[j]){connected[j]=255;queue[tail++]=j;}});
 donor.fill(-1);tail=0;for(let i=0;i<n;i++)if(connected[i]&&excess(originalRgba,i,keyColor)<=8){donor[i]=i;queue[tail++]=i;}
 for(let q=0;q<tail;q++){const i=queue[q];neighbours(i,j=>{if(connected[j]&&donor[j]<0){donor[j]=donor[i];queue[tail++]=j;}});}
 const rgba=new Uint8ClampedArray(canonicalRgba),key=keyColor==='magenta'?[255,0,255]:[0,255,0];let restored=0,despilled=0,unresolved=0,protectedCount=0;
 for(let i=0;i<n;i++){
  const p=i*4,restore=connected[i]&&!canonicalRgba[p+3];if(restore){rgba.set(originalRgba.subarray(p,p+4),p);restored++;}
  if(protectedSet.has(i)){if(connected[i])protectedCount++;continue;}
  if(!(restore&&excess(originalRgba,i,keyColor)>8)&&!fringeSet.has(i))continue;
  need(connected[i],'fringe outside source-supported paint');const j=donor[i];if(j<0){unresolved++;continue;}
  // Least-squares source C = alpha*observed donor F + (1-alpha)*key K.
  // F is an actual source pixel reached only through source-supported paint.
  const f=originalRgba.subarray(j*4,j*4+3);let dot=0,norm=0;for(let c=0;c<3;c++){dot+=(originalRgba[p+c]-f[c])*(key[c]-f[c]);norm+=(key[c]-f[c])**2;}
  const alpha=Math.round(255*Math.max(0,Math.min(1,1-dot/norm)));need(Number.isFinite(alpha),'unmix donor');
  for(let c=0;c<3;c++)rgba[p+c]=f[c];rgba[p+3]=restore?alpha:Math.min(canonicalRgba[p+3],alpha);despilled++;
 }
 // Reviewed exclusions affect only explicit targets after the historical default.
 // The ordinary donor map and every unselected pixel remain authoritative.
 let reviewedDonorExclusions,reviewedDonors;
 need(Array.isArray(donorExclusionPixels),'donor exclusion list');
 if(donorExclusionPixels.length){
  need(fringeSet.size>0,'donor exclusions require explicit fringe targets');
  need(donorExclusionSource?.width===w&&donorExclusionSource?.height===h&&donorExclusionSource?.originalRgbaSha256===originalHash,'donor source hash/dimensions');
  const excluded=new Set(donorExclusionPixels);
  need(excluded.size===donorExclusionPixels.length,'duplicate donor exclusion index');
  for(const i of excluded){
   need(Number.isInteger(i)&&i>=0&&i<n,'donor exclusion index');
   need(!protectedSet.has(i),'protected pigment conflicts with donor exclusion');
   need(connected[i]&&excess(originalRgba,i,keyColor)<=8,'donor exclusion must name a connected eligible source donor');
  }
  reviewedDonors=new Int32Array(n);reviewedDonors.fill(-1);tail=0;
  for(let i=0;i<n;i++)if(connected[i]&&excess(originalRgba,i,keyColor)<=8&&!excluded.has(i)){reviewedDonors[i]=i;queue[tail++]=i;}
  for(let q=0;q<tail;q++){const i=queue[q];neighbours(i,j=>{if(connected[j]&&reviewedDonors[j]<0){reviewedDonors[j]=reviewedDonors[i];queue[tail++]=j;}});}
  const targets=[],changedTargets=[],unresolvedTargets=[];
  for(const i of fringeSet){
   const j=reviewedDonors[i],p=i*4;
   if(j<0){unresolvedTargets.push(i);targets.push({index:i,donorIndex:null});continue;}
   const f=originalRgba.subarray(j*4,j*4+3),before=[...rgba.subarray(p,p+4)];let dot=0,norm=0;
   for(let c=0;c<3;c++){dot+=(originalRgba[p+c]-f[c])*(key[c]-f[c]);norm+=(key[c]-f[c])**2;}
   const alpha=Math.round(255*Math.max(0,Math.min(1,1-dot/norm)));need(Number.isFinite(alpha),'reviewed donor unmix');
   for(let c=0;c<3;c++)rgba[p+c]=f[c];rgba[p+3]=Math.min(before[3],alpha);
   if(before.some((value,c)=>value!==rgba[p+c]))changedTargets.push(i);
   targets.push({index:i,donorIndex:j,donorRgb:[...f]});
  }
  reviewedDonorExclusions={status:unresolvedTargets.length?'UNRESOLVED':'RESOLVED',source:{width:w,height:h,originalRgbaSha256:originalHash},excludedPixels:[...excluded].sort((a,b)=>a-b),targets,changedTargets,unresolvedTargets};
 }
 need(sha(originalRgba)===originalHash&&sha(canonicalRgba)===canonicalRgbaSha256,'input mutated');
 return {rgba,sourceSupport:support,connectedSupport:connected,donors:donor,...(reviewedDonors?{reviewedDonors}:{}),receipt:{schema:'cf.post-key-matte/v1',originalRgbaSha256:originalHash,canonicalRgbaSha256,outputRgbaSha256:sha(rgba),keyColor,restoredSourcePixels:restored,despilledPixels:despilled,unresolvedPixels:unresolved,protectedPigmentPixels:protectedCount,canonicalUnchanged:true,originalUnchanged:true,sourceClassifier:'unchanged keyAndDespill pre-erosion classifier',matte:'source-supported connected recovery; no erosion; no fabricated bridges',despill:'observed-source donor through connected support; least-squares key unmix',admission:false,...(reviewedDonorExclusions?{reviewedDonorExclusions}:{})}};
}
