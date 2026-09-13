/** Small author-owned plan only; no weights, derivation or model selection. */
import {createHash} from 'node:crypto';
export const BROWSER_VARIANT_SOURCE=Object.freeze({
  source:'tools/local-image-generation/browser-variant-plan.json',
  target:'__local_ai/browser-variant-plan.json',bytes:142918,
  sha256:'26263980f6dce7f3578a904aa9fe64649530e43797bfc94a0ddb8b2a3aaace81',
});
export const BROWSER_VARIANT_DESCRIPTOR=Object.freeze({url:'/'+BROWSER_VARIANT_SOURCE.target,
  sha256:BROWSER_VARIANT_SOURCE.sha256,bytes:BROWSER_VARIANT_SOURCE.bytes,payloadBytes:352323881});
export function assertBrowserVariantPlan(bytes){
  if(!Buffer.isBuffer(bytes)||bytes.length!==BROWSER_VARIANT_SOURCE.bytes
    ||createHash('sha256').update(bytes).digest('hex')!==BROWSER_VARIANT_SOURCE.sha256)
    throw Error('Browser variant plan bytes differ from pinned source');
  const plan=JSON.parse(bytes.toString('utf8'));
  if(plan.schema!=='cf.local-model-variant-plan.v1'||plan.variant!=='q8-block32-repacked-v1'
    ||plan.qualityAccepted!==false||plan.deviceQualified!==false)
    throw Error('Browser variant plan identity differs');
  return BROWSER_VARIANT_DESCRIPTOR;
}
