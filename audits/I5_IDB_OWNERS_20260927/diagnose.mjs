import fs from'node:fs';import path from'node:path';import{pathToFileURL}from'node:url';import{spawnSync}from'node:child_process';
const root=process.cwd(),dir=path.resolve('audits/I5_FOREGROUND_20260927/diagnostic'),source=fs.readFileSync(dir+'/collector-backing-minimal.mjs','utf8'),probe=fs.readFileSync('audits/I5_IDB_OWNERS_20260927/listener-probe.js','utf8');
const marker='export async function runForegroundDiagnostic(out) {';if(source.split(marker).length!==2)throw Error('Diagnostic boundary drift');
const footer=`export async function runForegroundDiagnostic(out) {
 const report={scope:'IDB listener ownership diagnostic, not calibration/certification',points:[]};const server=await serveDist();let browser;
 try { browser=await openChromiumCdp(compendiumCdpOptions('candidate',{label:'IDB listener owners',userDataPrefix:'cf-idb-listeners',startupTimeoutMs:15000}));
 const original=browser.send;const installed=new Set();
 const wrapped={...browser,send:async(method,params,session)=>{
  const value=await original(method,params,session);
  if(method==='Page.enable'&&!installed.has(session)){installed.add(session);await original('Page.addScriptToEvaluateOnNewDocument',{source:${JSON.stringify(probe)}},session);}
  if(method==='Memory.getDOMCounters'){
    const r=await original('Runtime.evaluate',{expression:'({owners:globalThis.__cfIdbOwners?.(), panel:window.__CF_SLICE__?.api?.compendiumDiagnostics()?.panel})',returnByValue:true},session);
    report.points.push({dom:value,owners:r.result.value?.owners,panel:r.result.value?.panel});
  }return value;
 }};
 await collectProfile({profile:'desktop',viewport:PROFILES.desktop,fixture:buildCompendiumFixture(),browser:wrapped,origin:server.origin,veteranRaw:JSON.stringify(readJson(baselineSavePath).inputs.veteran_rich),runId:path.basename(out,'.json'),candidateSpeciesArt:candidateProducerAuthorityFromDist().graph});
 }catch(error){report.partial=error.compendiumPartialEvidence;report.error=error.message;}finally{await browser?.close();await server.close();fs.writeFileSync(out,JSON.stringify(report,null,2)+'\\n');}
}
`;
const temp=dir+'/.idb-listener-diagnostic.mjs';fs.writeFileSync(temp,source.slice(0,source.indexOf(marker))+footer,{flag:'wx'});
try{const r=spawnSync(process.execPath,['--input-type=module','-e',`const m=await import(${JSON.stringify(pathToFileURL(temp).href)});await m.runForegroundDiagnostic(${JSON.stringify(process.argv[2])});`],{env:process.env,stdio:'inherit'});process.exitCode=r.status??2;}finally{fs.unlinkSync(temp);}
