/** Prepared phone probe only. Importing this module never opens a server or browser. */
import fs from 'node:fs/promises';import {createReadStream} from 'node:fs';import path from 'node:path';import http from 'node:http';import https from 'node:https';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {hashFile} from './verify-pins.mjs';import {validatePhoneManifest,phoneRequest} from './phone-route-contract.mjs';import {conservationTerminal} from './proof-contract.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';import {finishConservation} from '../../port/v2/tools/painted-creature/finish-conservation.mjs';import {padCreatureFinishCanvas,creatureFinishMask} from '../../tools/local-image-generation/creature-finish-math.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function phoneHandler({root,routes,subjectIds,output,onState=async()=>({}),onTerminal=()=>{},requests=[],errors=[]}){
 return async(req,res)=>{
  const verdict=phoneRequest(req.method,req.url,routes,subjectIds,req.headers.range!==undefined);requests.push({method:req.method,path:req.url,status:verdict.status});
  for(const [key,value] of Object.entries({'Cache-Control':'no-store','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff'}))res.setHeader(key,value);
  if(verdict.status!==200){res.writeHead(verdict.status).end();return;}
  try{
   if(verdict.kind==='asset'){
    const row=verdict.asset,file=path.join(root,row.file);res.setHeader('Content-Length',row.bytes);
    res.setHeader('Content-Type',row.route==='/'?'text/html':file.endsWith('.mjs')?'text/javascript':file.endsWith('.wasm')?'application/wasm':file.endsWith('.json')?'application/json':'application/octet-stream');
    const stream=createReadStream(file);stream.on('error',()=>{errors.push('Asset stream failed '+row.route);res.destroy();});res.on('close',()=>stream.destroy());stream.pipe(res);return;
   }
   if(verdict.name==='probe-state.json')res.once('finish',onTerminal);
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>20*1024*1024)throw Error('Output exceeds limit');chunks.push(chunk);}
   const body=Buffer.concat(chunks);await fs.writeFile(path.join(output,verdict.name),body,{flag:'wx'});
   const result=verdict.name==='probe-state.json'?await onState(JSON.parse(body.toString('utf8'))):{status:'RETAINED'};
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
  }catch(error){errors.push(String(error).replace(/\/Users\/[^/\s]+/g,'~'));if(!res.headersSent)res.writeHead(500);res.end();}
 };
}

async function main(){
 const args=new Map();for(let i=2;i<process.argv.length;i+=2){if(!/^--(?:host|port|out|tls-cert|tls-key)$/.test(process.argv[i])||!process.argv[i+1]||args.has(process.argv[i]))throw Error('Expected unique --host/--port/--out/--tls-cert/--tls-key pairs');args.set(process.argv[i],process.argv[i+1]);}
 const dir=import.meta.dirname,root=path.resolve(dir,'../..'),packet=path.join(dir,'phone-probe'),host=args.get('--host')??'127.0.0.1',port=Number(args.get('--port')??8443),cert=args.get('--tls-cert'),key=args.get('--tls-key');
 if(!args.has('--out')||!Number.isInteger(port)||port<1||port>65535||Boolean(cert)!==Boolean(key)||(!cert&&!['127.0.0.1','::1'].includes(host)))throw Error('New audit output, valid port and trusted TLS required for a device-reachable host');
 const output=path.resolve(args.get('--out'));if(!output.startsWith(packet+path.sep))throw Error('Output must be a new directory below phone-probe');await fs.mkdir(output);
 const manifestPath=path.join(packet,'manifest.json'),manifest=JSON.parse(await fs.readFile(manifestPath)),routes=validatePhoneManifest(manifest),manifestSha=(await hashFile(manifestPath)).sha256;
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),requests=[],errors=[],receipt={schema:'cf.c132-phone-probe-result/v1',status:'LEAF_RED',head,manifestSha256:manifestSha,visualVerdict:'REJECTED',qualityAccepted:false,deviceQualified:false,productAdmission:false,requests,errors,rows:[]};
 const release=acquireWorkspaceLock('C132 isolated rejected-candidate phone probe');let server,timer,stop;
 const verify=async()=>{
  if((await hashFile(manifestPath)).sha256!==manifestSha)throw Error('Phone manifest drift');
  for(const row of [...manifest.routes,...manifest.sources,manifest.provenance.result,manifest.provenance.preparedManifest]){const actual=await hashFile(path.join(root,row.file));if(actual.sha256!==row.sha256||actual.bytes!==row.bytes)throw Error('Phone pinned bytes drift '+row.file);}
  if(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()!==head)throw Error('Phone HEAD drift');
 };
 try{
  await verify();receipt.startIntegrity='PASS';
  const inputs=JSON.parse(await fs.readFile(path.join(root,routes.get('/inputs.json').file)));if(inputs.mode!=='phone'||inputs.embedding.sha256!==manifest.embedding.sha256)throw Error('Phone input mode/embedding');
  const require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
  const done=new Promise(resolve=>{stop=resolve;});
  const onState=async(state)=>{
   receipt.client=state;
   if(state.status==='complete'&&(state.mode!=='phone'||state.textEncoderLoaded!==false||state.promptSha256!==manifest.embedding.promptSha256))throw Error('Phone precomputed-conditioning boundary');
   for(const row of state.rows??[]){
    const input=inputs.subjects.find(s=>s.id===row.id);if(!input)throw Error('Unknown phone subject');
    const a=await fs.readFile(path.join(root,routes.get(input.master.url).file)),labels=await fs.readFile(path.join(root,routes.get(input.labels.url).file)),b=await fs.readFile(path.join(output,row.id+'-finished.png')),reconstruction=await fs.readFile(path.join(output,row.id+'-reconstruction.png'));
    if(sha(b)!==row.sha256||sha(reconstruction)!==row.reconstructionSha256)throw Error('Phone artifact identity');
    const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});if(info.width!==input.width||info.height!==input.height)throw Error('Phone output canvas');
    const work=padCreatureFinishCanvas(a,labels,input.width,input.height),mask=creatureFinishMask(work.master,work.labels,work.width,work.height);let protectedChanges=0;
    for(let y=0;y<input.height;y++)for(let x=0;x<input.width;x++){const i=(y*input.width+x)*4;if(!mask.editable[y*work.width+x]&&[0,1,2].some(c=>a[i+c]!==data[i+c]))protectedChanges++;}
    const conservation=finishConservation(a,data,labels,input.width,input.height);receipt.rows.push({...row,conservation,protectedChanges,status:conservation.status==='PASS'&&!protectedChanges?'PASS':'FAIL',qualityAccepted:false});
   }
   receipt.status=conservationTerminal(state.status,receipt.rows,manifest.subjectIds,[...errors,...(state.cleanupErrors??[])]);return {status:receipt.status,visualVerdict:'REJECTED',deviceQualified:false};
  };
  const handler=phoneHandler({root,routes,subjectIds:manifest.subjectIds,output,onState,onTerminal:()=>stop(),requests,errors});
  server=cert?https.createServer({cert:await fs.readFile(cert),key:await fs.readFile(key)},handler):http.createServer(handler);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  const interrupt=()=>{errors.push('Interrupted');stop();};process.once('SIGINT',interrupt);
  timer=setTimeout(()=>{errors.push('Phone probe deadline reached');stop();},15*60*1000);
  console.log(JSON.stringify({status:'WAITING_FOR_MANUAL_PROBE',host,port,tls:Boolean(cert),visualVerdict:'REJECTED',qualityAccepted:false,deviceQualified:false}));
  await done;process.removeListener('SIGINT',interrupt);
 }catch(error){errors.push(String(error).replace(/\/Users\/[^/\s]+/g,'~'));}
 finally{
  clearTimeout(timer);if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  try{await verify();receipt.endIntegrity='PASS';}catch(error){errors.push(String(error).replace(/\/Users\/[^/\s]+/g,'~'));}
  if(errors.length)receipt.status='LEAF_RED';release();await fs.writeFile(path.join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 }
 console.log(JSON.stringify({status:receipt.status,visualVerdict:'REJECTED',deviceQualified:false}));if(receipt.status!=='CONSERVATION_PASS')process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
