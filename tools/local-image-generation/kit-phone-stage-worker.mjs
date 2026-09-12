/** Probe-only three-session worker. No tokenizer import or text-encoder fallback. */
import * as ort from './node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs';
import {createKitWorkerEngine,admitPrecomputedKitText} from './kit-worker-engine.mjs';
import {admitKitEngineJob} from './kit-engine-math.mjs';
import {sha256} from './kit-worker-expansion.mjs';
let busy=false,used=false,engine;
onmessage=async({data:job})=>{
 if(busy||used||job?.stage!=='kit-v4'){postMessage({type:'error',requestId:job?.requestId,message:'One phone finisher attempt only'});return;}
 busy=true;used=true;
 try{
  admitKitEngineJob(job.recipe);
  const json=await fetch('/__local_ai/embeddings/earth-rain-v1.json'),blob=await fetch('/__local_ai/embeddings/earth-rain-v1.f16');if(!json.ok||!blob.ok)throw Error('Pinned accepted embedding unavailable');
  const manifest=await json.json(),bytes=await blob.arrayBuffer();
  if(bytes.byteLength!==6389760||await sha256(bytes)!=='46f0533d51e3c436b6d6cf6bcfa3e8af0c5d402b51e6d4570e13dda0724a20c7')throw Error('Phone embedding pin mismatch');
  const precomputedText={manifest,data:new Uint16Array(bytes)};await admitPrecomputedKitText(precomputedText,job.recipe.finisherPrompt);
  engine=await createKitWorkerEngine({ort,precomputedText,progress:event=>postMessage({type:'progress',...event})});
  const result=await engine.paint(job.recipe);if(result.sessionCreates.text!==0||['encode','denoise','decode'].some(k=>result.sessionCreates[k]!==1))throw Error('Three-session phone boundary failed');
  postMessage({type:'complete',requestId:job.requestId,...result});
 }catch(e){postMessage({type:'error',requestId:job?.requestId,message:String(e.stack??e)});}
 finally{busy=false;await engine?.dispose();}
};
