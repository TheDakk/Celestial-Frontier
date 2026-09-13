import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';

// Real compute, not feature presence. Uses an isolated profile and loopback origin.
const output = process.argv[2];
if (!output) throw new Error('Usage: node probe-webgpu.mjs OUTPUT.json');
const server = http.createServer((_req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<!doctype html><title>Celestial Frontier WebGPU qualification</title>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let cdp;
const receipt = { startedAt: new Date().toISOString(), kind: 'browser-compute-probe', status: 'FAIL' };
try {
  cdp = await openChromiumCdp({ label: 'CF AI WebGPU probe', userDataPrefix: 'cf-ai-probe-', commandTimeoutMs: 45000 });
  receipt.browser = cdp.browser;
  const {targetId} = await cdp.send('Target.createTarget', {url:`http://127.0.0.1:${server.address().port}/`});
  const {sessionId} = await cdp.send('Target.attachToTarget', {targetId, flatten:true});
  const {result, exceptionDetails} = await cdp.send('Runtime.evaluate', {
    awaitPromise:true, returnByValue:true, expression:`(async () => {
      if (!navigator.gpu) throw Error('WebGPU unavailable');
      const adapter = await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
      if (!adapter) throw Error('No WebGPU adapter');
      const info = adapter.info;
      const details = {vendor:info.vendor,architecture:info.architecture,device:info.device,description:info.description,isFallbackAdapter:info.isFallbackAdapter};
      if (info.isFallbackAdapter || /swiftshader|llvmpipe|software/i.test(JSON.stringify(details))) throw Error('Software adapter: '+JSON.stringify(details));
      if (!adapter.features.has('shader-f16')) throw Error('shader-f16 required');
      const limits = Object.fromEntries(['maxBufferSize','maxStorageBufferBindingSize','maxComputeWorkgroupStorageSize','maxStorageBuffersPerShaderStage'].map(k=>[k,adapter.limits[k]]));
      const device = await adapter.requestDevice({requiredFeatures:['shader-f16']});
      try {
        device.pushErrorScope('validation');
        const src = device.createBuffer({size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
        const dst = device.createBuffer({size:16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
        const module = device.createShaderModule({code:'enable f16; @group(0) @binding(0) var<storage,read_write> a: array<f32>; @compute @workgroup_size(4) fn main(@builtin(global_invocation_id) id:vec3<u32>){a[id.x]=f32(f16(id.x+1u)*f16(2.0));}'});
        const pipeline = await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
        const group = device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:src}}]});
        const encoder=device.createCommandEncoder(); const pass=encoder.beginComputePass();
        pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(1);pass.end();
        encoder.copyBufferToBuffer(src,0,dst,0,16);device.queue.submit([encoder.finish()]);
        await dst.mapAsync(GPUMapMode.READ); const values=Array.from(new Float32Array(dst.getMappedRange()));
        dst.unmap();src.destroy();dst.destroy();const error=await device.popErrorScope();
        if(error) throw Error(error.message);
        if(JSON.stringify(values)!=='[2,4,6,8]') throw Error('Compute outcome mismatch '+values);
        return {adapter:details,features:Array.from(adapter.features),limits,values,deviceMemory:navigator.deviceMemory??null};
      } finally {device.destroy();}
    })()`
  },sessionId);
  if(exceptionDetails) throw new Error(exceptionDetails.exception?.description??exceptionDetails.text);
  receipt.compute=result.value; receipt.status='PASS';
} catch(error) {receipt.error=String(error.stack??error);process.exitCode=1;}
finally {
  try {await cdp?.close();receipt.browserClosed=true;} catch(error) {receipt.cleanupError=String(error);receipt.status='FAIL';process.exitCode=1;}
  await new Promise(resolve=>server.close(resolve));
  receipt.finishedAt=new Date().toISOString();
  await fs.mkdir(path.dirname(output),{recursive:true});
  await fs.writeFile(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(receipt));
}
