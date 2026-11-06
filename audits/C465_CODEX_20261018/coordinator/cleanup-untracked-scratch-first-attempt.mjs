/** Delete only own untracked, PNG-exact prepared buffers and ignored idle Vitest caches. */
import fs from'node:fs';import path from'node:path';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const B='audits/C465_CODEX_20261018/coordinator',out=B+'/scratch-end.json';if(fs.existsSync(out))throw Error('Immutable receipt exists');
const require=createRequire(path.resolve('port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp'),sha=x=>createHash('sha256').update(x).digest('hex');
const tracked=new Set(execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0')),rows=[];let bytes=0,control=false;
for(const slug of['vole-r02','scallop-c2-r01','chiton-c2-r02']){
 const dir=B+'/finishes/'+slug+'/finished/prepared',input=JSON.parse(fs.readFileSync(dir+'/inputs.json')).subjects[0];
 for(const field of['master','labels']){
  const raw=dir+'/'+path.basename(input[field].url),png=dir+'/'+path.basename(field==='master'?input.masterPng.url:input.labels.url.replace(/\.rgba$/,'.png'));
  if(!fs.existsSync(raw))continue;if(tracked.has(raw)){rows.push({path:raw,status:'RETAIN_SIGNED_EVIDENCE',reason:'Already selected in signed wave; no unique or pinned evidence deletion.'});continue;}
  const d=fs.readFileSync(raw),decoded=await sharp(png).ensureAlpha().raw().toBuffer();if(!d.equals(decoded)||sha(d)!==input[field].sha256)throw Error('Not PNG-exact '+raw);
  if(!control){const mutant=Buffer.from(decoded);mutant[0]^=1;if(sha(mutant)===sha(d))throw Error('Bad control');control=true;}
  fs.unlinkSync(raw);bytes+=d.length;rows.push({path:raw,status:'DELETED_PNG_EXACT_UNTRACKED_SCRATCH',bytes:d.length,sha256:sha(d),regenerateFrom:png,pngSha256:sha(fs.readFileSync(png)),recipe:'sharp(PNG).ensureAlpha().raw().toBuffer(); exact input hash verified'});
 }
}
for(const dir of['port/v2/node_modules/.vite','audits/C465_CODEX_20261018/w2-checkpoint/node_modules/.vite']){
 if(!fs.existsSync(dir))continue;if(fs.lstatSync(dir).isSymbolicLink())throw Error('Cache symlink refused');const real=fs.realpathSync(dir);if(!real.startsWith(fs.realpathSync('.')+path.sep))throw Error('Outside checkout cache');execFileSync('git',['check-ignore','--quiet',dir]);
 let n=0;function scan(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isSymbolicLink())throw Error('Cache child symlink refused');if(e.isDirectory())scan(f);else{if(tracked.has(f))throw Error('Tracked cache refused');n+=fs.statSync(f).size;}}}scan(dir);fs.rmSync(dir,{recursive:true});bytes+=n;rows.push({path:dir,status:'DELETED_IGNORED_REGENERABLE_CACHE',bytes:n});
}
fs.writeFileSync(out,JSON.stringify({status:'PASS',bytesDeleted:bytes,PNGByteMismatchNegativeControl:control,uniqueOriginalsOrFinishedAssetsDeleted:0,rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',bytesDeleted:bytes,rows:rows.length}));
