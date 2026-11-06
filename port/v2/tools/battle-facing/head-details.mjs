/** Authored source-space supports, not per-creature clips. Angles come from the shared pose. */
const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export function compileHeadDetails(rest,details,joints){
 if(!(rest instanceof Float32Array)||rest.length%2||!Array.isArray(details)||details.length>16)throw Error('Invalid head detail inventory');
 const names=new Set(),compiled=details.map(d=>{
  if(!joints.includes(d.joint)||names.has(d.joint)||!Array.isArray(d.pivot)||d.pivot.length!==2||!Array.isArray(d.bounds)||d.bounds.length!==4||![...d.pivot,...d.bounds,d.feather,d.extent,d.direction].every(Number.isFinite)||d.feather<=0||d.extent<=0||Math.abs(d.direction)!==1||d.bounds[0]>=d.bounds[2]||d.bounds[1]>=d.bounds[3])throw Error('Invalid authored detail support');names.add(d.joint);
  const weights=new Float32Array(rest.length/2),[left,top,right,bottom]=d.bounds;
  for(let i=0;i<weights.length;i++){const x=rest[i*2],y=rest[i*2+1],rim=Math.min(x-left,right-x,y-top,bottom-y);weights[i]=smooth(rim/d.feather)*smooth((y-d.pivot[1])*d.direction/d.extent);}
  if(!weights.some(v=>v>0))throw Error('Empty head detail support');if(d.rotationSign!==undefined&&![1,-1].includes(d.rotationSign))throw Error('Invalid detail rotation basis');return{joint:d.joint,pivot:[...d.pivot],weights,rotationSign:d.rotationSign,support:structuredClone(d),active:[...weights.keys()].filter(i=>weights[i]>0)};
 });return{rest:rest.slice(),compiled};
}
export function applyHeadDetails(program,pose,reflected,out){
 if(out.length!==program.rest.length)throw Error('Head detail output dimensions');for(const d of program.compiled)if(!Number.isFinite(pose[d.joint]?.rotation??0))throw Error('Nonfinite head detail pose');out.set(program.rest);
 for(const d of program.compiled){const radians=(pose[d.joint]?.rotation??0)*(d.rotationSign??(reflected?-1:1));if(!Number.isFinite(radians))throw Error('Nonfinite head detail pose');if(!radians)continue;const steps=32,c=Math.cos(radians/steps),s=Math.sin(radians/steps),[px,py]=d.pivot,{bounds:[left,top,right,bottom],feather,extent,direction}=d.support;
  // Integrate the compact rotation field, instead of displacing a tip across
  // stationary boundary vertices in one linear-blend jump. Source angles and
  // support bounds are unchanged; no motion clamp or triangle waiver.
  const active=[];for(let i=0;i<out.length/2;i++){const x=out[i*2],y=out[i*2+1];if(x>left&&x<right&&y>top&&y<bottom&&(y-py)*direction>0)active.push(i);}
  for(let step=0;step<steps;step++)for(const i of active){const xx=out[i*2],yy=out[i*2+1],rim=Math.min(xx-left,right-xx,yy-top,bottom-yy),w=smooth(rim/feather)*smooth((yy-py)*direction/extent);if(!w)continue;const x=xx-px,y=yy-py;out[i*2]+=(c*x-s*y-x)*w;out[i*2+1]+=(s*x+c*y-y)*w;}
 }return out;
}
