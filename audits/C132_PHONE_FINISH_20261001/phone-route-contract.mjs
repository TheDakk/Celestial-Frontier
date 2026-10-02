/** Separate phone-probe transport. No broad directory/static-file fallback. */
export const PHONE_BYTE_LIMIT=1_000_000_000;
export const PHONE_MODEL_ROUTES=Object.freeze(['/models/encoder.onnx','/models/unet.onnx','/models/vae_decoder.onnx']);
export const PHONE_ORT_ROUTES=Object.freeze(['/ort/ort-wasm-simd-threaded.asyncify.mjs','/ort/ort-wasm-simd-threaded.asyncify.wasm']);
const HEX=/^[a-f0-9]{64}$/;
export function validatePhoneManifest(manifest){
 if(manifest?.schema!=='cf.c132-phone-probe/v1'||manifest.mode!=='phone'||manifest.qualityAccepted!==false||manifest.visualVerdict!=='REJECTED'||manifest.deviceQualified!==false)throw Error('Phone probe scope');
 if(!Array.isArray(manifest.subjectIds)||!manifest.subjectIds.length||new Set(manifest.subjectIds).size!==manifest.subjectIds.length||manifest.subjectIds.some(id=>!/^\d\d-[a-z-]+$/.test(id)))throw Error('Phone subject identity');
 const expected=new Set(['/', '/probe.mjs','/client.mjs','/inputs.json','/embedding.f32',...PHONE_MODEL_ROUTES,...PHONE_ORT_ROUTES,...manifest.subjectIds.flatMap(id=>['/inputs/'+id+'-master.rgba','/inputs/'+id+'-labels.rgba'])]);
 const seen=new Set();let bytes=0,models=0;
 for(const row of manifest.routes??[]){
  if(!expected.has(row.route)||seen.has(row.route)||/tokeniz|text.?encoder/i.test(row.route)||!HEX.test(row.sha256)||!Number.isSafeInteger(row.bytes)||row.bytes<=0||typeof row.file!=='string'||row.file.startsWith('/')||row.file.split(/[\\/]/).some(p=>p==='..'||p===''))throw Error('Phone route inventory');
  seen.add(row.route);bytes+=row.bytes;if(PHONE_MODEL_ROUTES.includes(row.route))models+=row.bytes;
 }
 if(seen.size!==expected.size||!HEX.test(manifest.embedding?.sha256)||manifest.embedding.bytes!==77*768*4||!HEX.test(manifest.embedding.promptSha256)||JSON.stringify(manifest.embedding.dims)!=='[1,77,768]')throw Error('Phone embedding/route closure');
 const embedding=manifest.routes.find(row=>row.route==='/embedding.f32');if(embedding.sha256!==manifest.embedding.sha256||embedding.bytes!==manifest.embedding.bytes)throw Error('Phone embedding route mismatch');
 if(manifest.budget?.limitBytes!==PHONE_BYTE_LIMIT||manifest.budget.servedBytes!==bytes||manifest.budget.modelBytes!==models||bytes>PHONE_BYTE_LIMIT)throw Error('Phone byte budget');
 return new Map(manifest.routes.map(row=>[row.route,row]));
}
export function phoneRequest(method,target,routes,subjectIds,range=false){
 if(typeof target!=='string'||!target.startsWith('/')||/[?#%\\]/.test(target)||target.includes('//')||target.split('/').some(p=>p==='.'||p==='..')||range)return {status:403};
 if(method==='GET')return routes.has(target)?{status:200,kind:'asset',asset:routes.get(target)}:{status:404};
 if(method!=='POST')return {status:405};
 const outputs=new Set(['probe-state.json',...subjectIds.flatMap(id=>[id+'-finished.png',id+'-reconstruction.png'])]);
 const name=target.slice('/output/'.length);
 return target.startsWith('/output/')&&outputs.has(name)?{status:200,kind:'output',name}:{status:403};
}
