/** Deterministic C46 publisher. Verify every candidate before writing; preserve exact native PNG/receipt bytes. */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {loadContract,readSource,root} from './phone-contract-loader.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function verifyPublication(nativeDirectory){
 const directory=path.resolve(nativeDirectory),report=JSON.parse(await fs.readFile(path.join(directory,'result.json')));
 if(report.status!=='PASS'||report.rows?.length!==3||report.modelInferences!==3||report.phoneCreates!==0||report.detachedTransfers!==6||!/^[a-f0-9]{40}$/.test(report.head))throw Error('Native three-source proof missing');
 if(execFileSync('git',['show','-s','--format=%G?',report.head],{cwd:root,encoding:'utf8'}).trim()!=='G')throw Error('Native source is not signed G');
 if(!Array.isArray(report.sources)||!report.sources.length)throw Error('Native source receipts absent');
 for(const entry of report.sources){const file=path.resolve(root,entry.file);if(!file.startsWith(root+path.sep)||sha(await fs.readFile(file))!==entry.sha256)throw Error('Native producer changed: '+entry.file);}
 const api=await loadContract(),manifest=await fs.readFile(path.join(root,'tools/local-image-generation/model-manifest.json')),modelManifestHash=sha(manifest),rows=[];
 if([...report.rows.map(r=>r.id)].sort().join('|')!==[...api.IDS].sort().join('|'))throw Error('Three-source identity scope');
 for(const row of report.rows){if(row.status!=='PASS'||row.phone?.origin!=='delivery'||row.phone?.exactBytes!==true||row.retention?.inferences!==1||typeof row.originalReceipt!=='string')throw Error('Unverified native row');
  const png=await fs.readFile(path.join(directory,row.id+'-finished.png'));if(sha(png)!==row.sha256)throw Error('Native finished PNG mismatch');
  const receipt=JSON.parse(row.originalReceipt),original={key:receipt.key,sha256:row.sha256,blob:new Blob([png],{type:'image/png'}),receipt:row.originalReceipt};
  const verified=await api.verifyFinished(row.id,await readSource(api,row.id),modelManifestHash,original),receiptBytes=Buffer.from(row.originalReceipt,'utf8');
  if(png.length>8*1024*1024||receiptBytes.length>1048576)throw Error('Delivery bound');
  rows.push({id:row.id,key:verified.key,png,receipt:receiptBytes,sha256:sha(png),receiptSha256:sha(receiptBytes),identity:verified.identity,individualId:verified.source.individualId,genome:verified.genome});
 }
 return {report,rows};
}
export async function publishVerified(nativeDirectory,destination){
 const checked=await verifyPublication(nativeDirectory),target=path.resolve(destination);
 // Check every destination before writing any candidate. Existing exact files are idempotent; differing bytes refuse.
 for(const row of checked.rows)for(const[name,bytes]of[['original.png',row.png],['receipt.json',row.receipt]]){const file=path.join(target,row.key,name);try{const old=await fs.readFile(file);if(!old.equals(bytes))throw Error('Immutable destination differs: '+file);}catch(e){if(e.code!=='ENOENT')throw e;}}
 for(const row of checked.rows){const out=path.join(target,row.key);await fs.mkdir(out,{recursive:true});for(const[name,bytes]of[['original.png',row.png],['receipt.json',row.receipt]]){try{await fs.writeFile(path.join(out,name),bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}}}
 return {schema:'cf.c46-finished-publication/v1',sourceHead:checked.report.head,rows:checked.rows.map(({png,receipt,...row})=>({...row,pngBytes:png.length,receiptBytes:receipt.length,pngPath:`library/creature-finish/${row.key}/original.png`,receiptPath:`library/creature-finish/${row.key}/receipt.json`}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const[mode,directory,destination]=process.argv.slice(2);if(mode==='--verify'&&directory&&!destination){const v=await verifyPublication(directory);console.log(JSON.stringify({status:'PASS',head:v.report.head,keys:v.rows.map(r=>r.key)}));}else if(mode==='--publish'&&directory&&destination){console.log(JSON.stringify(await publishVerified(directory,destination),null,2));}else throw Error('Usage: phone-publisher.mjs --verify NATIVE_DIR | --publish NATIVE_DIR DESTINATION');}
