/** Conservation is measured on decoded pixels; original ownership labels never change. */
function lab(a,i){const rgb=[0,1,2].map(c=>{const v=a[i*4+c]/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}),[r,g,b]=rgb;
 const f=v=>v>216/24389?Math.cbrt(v):v*841/108+4/29;
 const x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);return [116*y-16,500*(x-y),200*(y-z)];}
function colorStats(a,b,labels,label){let n=0,delta=0,sa=0,sb=0,aa=0,bb=0,ab=0;for(let i=0;i<labels.length/4;i++)if(labels[i*4]===label){const l=lab(a,i),r=lab(b,i);delta+=Math.hypot(...l.map((v,c)=>v-r[c]));const x=.2126*a[i*4]+.7152*a[i*4+1]+.0722*a[i*4+2],y=.2126*b[i*4]+.7152*b[i*4+1]+.0722*b[i*4+2];n++;sa+=x;sb+=y;aa+=x*x;bb+=y*y;ab+=x*y;}const ma=sa/n,mb=sb/n,va=aa/n-ma*ma,vb=bb/n-mb*mb,cov=ab/n-ma*mb;return {meanDeltaE76:delta/n,luminanceSsim:((2*ma*mb+6.5025)*(2*cov+58.5225))/((ma*ma+mb*mb+6.5025)*(va+vb+58.5225)),ssimScope:'whole labeled part, population moments'};}
export function finishConservation(master,finished,labels,w,h,ratio=.95){
 if(master.length!==w*h*4||finished.length!==master.length||labels.length!==master.length||ratio!==.95)throw Error('Conservation dimensions/ratio');
 let alphaChanged=0,outsideChanged=0;const stats=new Map(),seen=new Uint8Array(w*h);
 const metric=(a,b,i,j)=>Math.hypot(...[0,1,2].map(c=>a[i*4+c]-b[j*4+c]));
 for(let i=0;i<w*h;i++){
  if(master[i*4+3]!==finished[i*4+3])alphaChanged++;
  if(master[i*4+3]===0)for(let c=0;c<4;c++)if(master[i*4+c]!==finished[i*4+c])outsideChanged++;
  const l=labels[i*4];if(!l)continue;
  if(!stats.has(l))stats.set(l,{label:l,pixels:0,components:0,boundarySamples:0,beforeGradient:0,afterGradient:0,sumSquaredError:0});
  const s=stats.get(l);s.pixels++;s.sumSquaredError+=metric(master,finished,i,i)**2;
  for(const j of [i%w<w-1?i+1:-1,i+w<w*h?i+w:-1])if(j>=0&&labels[j*4]!==l){s.boundarySamples++;s.beforeGradient+=metric(master,master,i,j);s.afterGradient+=metric(finished,finished,i,j);}
  if(!seen[i]){s.components++;const q=[i];seen[i]=1;for(let k=0;k<q.length;k++){const p=q[k];for(const j of [p%w?p-1:-1,p%w<w-1?p+1:-1,p-w,p+w])if(j>=0&&j<w*h&&!seen[j]&&labels[j*4]===l){seen[j]=1;q.push(j);}}}
 }
 const parts=[...stats.values()].map(s=>({...s,...colorStats(master,finished,labels,s.label),rgbRms:Math.sqrt(s.sumSquaredError/s.pixels/3),gradientRatio:s.beforeGradient?s.afterGradient/s.beforeGradient:1,componentsAfter:s.components}));
 const failures=[];if(alphaChanged)failures.push('alpha');if(outsideChanged)failures.push('outside');if(parts.some(s=>s.gradientRatio+1e-12<ratio))failures.push('boundary-gradient');
 return {status:failures.length?'FAIL':'PASS',alphaChanged,outsideChanged,ratio,parts,failures,componentCountBasis:'identical alpha and original label topology; invalid when alpha gate fails'};
}
