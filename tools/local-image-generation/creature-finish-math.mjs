/** Creature texture class for the accepted kit interpreter; no geometry authority. */
export const CREATURE_FINISH_SETTINGS=Object.freeze({strength:.35,steps:1,boundaryPixels:4,gradientRatio:.95});
export function admitCreatureFinishJob(job,ua=globalThis.navigator?.userAgent??''){
 if(job?.schema!=='cf.creature-finish.v1'||job.tier!=='desktop'||/Android|iPhone|iPad|Mobile/i.test(ua))throw Error('Creature finishing requires desktop tier');
 if(!Number.isSafeInteger(job.width)||!Number.isSafeInteger(job.height)||job.width<128||job.height<128||job.width>2048||job.height>2048||job.width%16||job.height%16||!Number.isSafeInteger(job.seed)||job.seed<0||job.seed>0xffffffff)throw Error('Creature finish dimensions/seed');
 if(JSON.stringify(job.settings)!==JSON.stringify(CREATURE_FINISH_SETTINGS)||typeof job.prompt!=='string'||job.prompt.length<100||job.prompt.length>8000)throw Error('Creature finish settings/prompt');
 for(const ref of [job.master,job.labels])if(!ref||ref.width!==job.width||ref.height!==job.height||!/^\/inputs\/[a-z0-9-]+\.rgba$/.test(ref.url)||!/^[a-f0-9]{64}$/.test(ref.sha256))throw Error('Creature finish input reference');
 return job;
}
export function creatureFinishMask(master,labels,w,h,radius=4){
 if(master.length!==w*h*4||labels.length!==master.length||radius!==4||w%16||h%16)throw Error('Creature mask shape');
 const editable=new Uint8Array(w*h),latent=new Float32Array(w*h/256);latent.fill(1);
 for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++){
  const i=y*w+x,label=labels[i*4];if(!label||master[i*4+3]!==255)continue;
  let inner=true;for(let dy=-radius;dy<=radius&&inner;dy++)for(let dx=-radius;dx<=radius;dx++){const j=(y+dy)*w+x+dx;if(master[j*4+3]!==255||labels[j*4]!==label){inner=false;break;}}
  if(inner)editable[i]=1;
 }
 for(let y=0;y<h/16;y++)for(let x=0;x<w/16;x++){let n=0;for(let dy=0;dy<16;dy++)for(let dx=0;dx<16;dx++)n+=editable[(y*16+dy)*w+x*16+dx];if(n/256>=.55)latent[y*w/16+x]=0;}
 if(!editable.some(Boolean)||!latent.some(v=>v===0))throw Error('No editable creature interior');
 return {editable,latent};
}
export function conserveCreaturePixels(master,generated,editable){
 if(master.length!==generated.length||editable.length*4!==master.length)throw Error('Creature composite shape');
 const out=new Uint8ClampedArray(master);for(let i=0;i<editable.length;i++)if(editable[i])for(let c=0;c<3;c++)out[i*4+c]=generated[i*4+c];return out;
}
