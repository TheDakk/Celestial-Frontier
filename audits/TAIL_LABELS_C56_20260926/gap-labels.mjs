/** Automatic post-verdict placement only. Preserve exact pixel ownership instead of
 * projecting a possibly disconnected region back through one lossy polygon. */
export function fillRemainderGap({rgba,labels,width:w,height:h,remainder,tail,stalk}){
 const need=(ok,m)=>{if(!ok)throw Error('Gap labels: '+m);};
 need(Number.isInteger(w)&&Number.isInteger(h)&&w>0&&h>0&&w<=2048&&h<=2048,'dimensions');
 need(rgba.length===w*h*4&&labels.length===w*h,'buffers');
 need([remainder,tail,stalk].every(n=>Number.isInteger(n)&&n>0&&n<256)&&new Set([remainder,tail,stalk]).size===3,'distinct nonzero owners');
 for(let i=0;i<labels.length;i++)need((rgba[i*4+3]>0)===(labels[i]>0),'complete source ownership');
 const neighbors=i=>{const x=i%w;return [x>0?i-1:-1,x<w-1?i+1:-1,i-w,i+w].filter(n=>n>=0&&n<w*h);};
 const dist=k=>{const d=new Int32Array(w*h).fill(-1),q=[];for(let i=0;i<labels.length;i++)if(labels[i]===k){d[i]=0;q.push(i);}need(q.length,'owner has no paint');for(let j=0;j<q.length;j++){const i=q[j];for(const n of neighbors(i))if(d[n]<0&&rgba[n*4+3]){d[n]=d[i]+1;q.push(n);}}return d;};
 const dt=dist(tail),ds=dist(stalk),boundary=new Set();
 for(let i=0;i<labels.length;i++)if(labels[i]===remainder&&ds[i]>=0&&neighbors(i).some(n=>labels[n]===tail))boundary.add(i);
 const components=[];while(boundary.size){const first=boundary.values().next().value,q=[first],c=[];boundary.delete(first);while(q.length){const i=q.pop();c.push(i);const x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&X<w&&Y>=0&&Y<h&&boundary.delete(Y*w+X))q.push(Y*w+X);}}components.push(c);}components.sort((a,b)=>b.length-a.length);
 if(!components.length)return{labels:labels.slice(),receipt:{changedPixels:0,reason:'No connected remainder-to-tail gap',components:[]}};
 const maxDistance=Math.max(...components[0].map(i=>ds[i]))+1;need(maxDistance<=w/4,'gap exceeds quarter-width locality');
 const out=labels.slice(),changed=[];for(let i=0;i<labels.length;i++)if(labels[i]===remainder&&dt[i]>=0&&ds[i]>=0&&dt[i]<=maxDistance&&ds[i]<=maxDistance){out[i]=stalk;changed.push(i);}
 let otherOwnersChanged=0,unowned=0;for(let i=0;i<labels.length;i++){if(labels[i]!==remainder&&labels[i]!==out[i])otherOwnersChanged++;if((rgba[i*4+3]>0)!==(out[i]>0))unowned++;}
 need(otherOwnersChanged===0&&unowned===0,'ownership conservation');
 return{labels:out,receipt:{schema:'cf.remainder-gap-labels/v1',tail,stalk,remainder,maxDistance,components:components.map(c=>c.length),changedPixels:changed.length,requestedRetained:changed.length,otherOwnersChanged,unowned,sourceRgbaChanges:0,contourProjection:false}};
}
