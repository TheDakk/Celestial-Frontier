// EXPLICIT SYNTHETIC WORKER: no ORT, model loading, inference or art output.
self.onmessage=({data:job})=>{
  if(!['text','denoise','decode'].includes(job.stage)){self.postMessage({type:'error',message:'Unexpected synthetic stage'});return;}
  self.postMessage({type:'progress',phase:'loading',synthetic:true});
  self.postMessage({type:'progress',phase:'loaded',synthetic:true});
  if(job.stage==='denoise')for(let step=1;step<=2;step++)self.postMessage({type:'progress',phase:'step',step,steps:2,synthetic:true});
  const data=job.stage==='text'?new Uint16Array([1]):job.stage==='denoise'?new Float32Array([0]):new Float32Array([-.8,.8,-.4,.4,0,0]);
  self.postMessage({type:'complete',data,synthetic:true},[data.buffer]);
};
