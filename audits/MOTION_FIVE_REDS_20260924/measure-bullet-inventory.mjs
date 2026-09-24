import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{createHash}from'node:crypto';import{createRequire}from'node:module';import{pathToFileURL,fileURLToPath}from'node:url';
import{rolldown}from'../../port/v2/node_modules/rolldown/dist/index.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-bullet-inventory-')),sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map();
const{JSDOM}=createRequire(new URL('../../port/v2/package.json',import.meta.url))('jsdom');
let bundle;
try{
 bundle=await rolldown({input:path.join(root,'port/v2/apps/game/src/release-content.ts'),platform:'node',plugins:[{name:'sources',transform(code,id){if(path.isAbsolute(id)&&fs.existsSync(id))sources.set(path.relative(root,id),sha(fs.readFileSync(id)));return null;}}]});
 const output=path.join(tmp,'release.mjs');await bundle.write({file:output,format:'es',codeSplitting:false});const{V2_DRAFT_RELEASE}=await import(pathToFileURL(output));
 const authored=V2_DRAFT_RELEASE.sections.flatMap(s=>s.bullets),dom=new JSDOM('<ul>'+authored.map(b=>'<li>'+b+'</li>').join('')+'</ul>');const rows=[...dom.window.document.querySelectorAll('li')].map(n=>n.textContent??'');dom.window.close();if(JSON.stringify(rows)!==JSON.stringify(authored))throw Error('Unexpected markup/text discrepancy');
 const report={scope:'Current rendered development bulletin identity; not Compendium calibration or historical certificate',count:rows.length,sha256:sha(JSON.stringify(rows)),rows,sources:[...sources].map(([file,sha256])=>({file,sha256}))};fs.writeFileSync(new URL('./bullet-inventory.json',import.meta.url),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({count:report.count,sha256:report.sha256}));
}finally{await bundle?.close();fs.rmSync(tmp,{recursive:true});}
