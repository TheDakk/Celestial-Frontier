/** R9 tool-only worker: one painted-creature finisher pass on the same kit
 * engine. Not shipped in the game; the landfall kit worker stays untouched. */
import * as ort from './node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs';
import {Tokenizer} from './node_modules/@huggingface/tokenizers/dist/tokenizers.mjs';
import {admitCreatureFinishJob} from './kit-engine-math.mjs';
import {createKitWorkerEngine} from './kit-worker-engine.mjs';
let engine=null,busy=false;
onmessage=async({data:job})=>{
 if(busy||job?.stage!=='creature-finish-v1'){postMessage({type:'error',requestId:job?.requestId,message:'Only one creature finish at a time is supported'});return;}
 busy=true;
 try{
  admitCreatureFinishJob(job.recipe);
  engine??=await createKitWorkerEngine({ort,Tokenizer,modelFiles:job.modelFiles,progress:event=>postMessage({type:'progress',...event})});
  const result=await engine.finishCreature(job.recipe);postMessage({type:'complete',requestId:job.requestId,...result});
 }catch(error){postMessage({type:'error',requestId:job.requestId,message:String(error.stack??error)});try{await engine?.dispose();}finally{engine=null;}}
 finally{busy=false;}
};
