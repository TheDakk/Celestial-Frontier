import {test} from 'node:test';import assert from 'node:assert/strict';import {admitManualPhoneStart,admitManualPhoneResult} from './manual-iphone-probe-contract.mjs';
test('one secure physical-family browser start; repeat, desktop, missing/low GPU and insecure controls reject',()=>{
 const c={secureContext:true,crossOriginIsolated:true,adapterAvailable:true,shaderF16:true,maxBufferSize:1073741824,userAgent:'iPhone Safari'};
 admitManualPhoneStart(c,0,false,113246208);
 for(const wrong of [{secureContext:false},{crossOriginIsolated:false},{shaderF16:false},{adapterAvailable:false},{maxBufferSize:1},{maxBufferSize:null},{userAgent:'Macintosh Safari'}])assert.throws(()=>admitManualPhoneStart({...c,...wrong},0,false,113246208));
 assert.throws(()=>admitManualPhoneStart(c,1,false,113246208));assert.throws(()=>admitManualPhoneStart(c,0,true,113246208));
});
test('exact three-session one-finisher outcome; text access, absent timing, extra passes and missing session reject',()=>{
 const d={sessionCreates:{text:0,encode:1,denoise:1,decode:1},organismPasses:0,measurements:[{}],elapsedMs:20000};admitManualPhoneResult(d,[]);
 for(const wrong of [{sessionCreates:{...d.sessionCreates,text:1}},{sessionCreates:{...d.sessionCreates,denoise:0}},{organismPasses:6},{measurements:[]},{elapsedMs:null}])assert.throws(()=>admitManualPhoneResult({...d,...wrong},[]));assert.throws(()=>admitManualPhoneResult(d,['/model/text_encoder_q4.onnx']));
});
