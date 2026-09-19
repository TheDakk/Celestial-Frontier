/** Local review delivery only. No network, Git writes, LFS or history rewriting. */
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../../..'),out=path.resolve(process.argv[2]);if(fs.existsSync(out))throw Error('New output folder required');fs.mkdirSync(out,{recursive:true});
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACMR','-z'],{cwd:root}).toString().split('\0').filter(Boolean).sort();
if(!files.length)throw Error('No staged review files');
const unstaged=execFileSync('git',['diff','--name-only','-z'],{cwd:root}).toString().split('\0').filter(Boolean);if(unstaged.some(p=>files.includes(p)))throw Error('Stage the current review bytes before packing');
const entries=files.map(file=>{const bytes=fs.readFileSync(path.join(root,file));return {file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};});
const snapshot={scope:'Uncommitted staged review snapshot; not a signed checkpoint or acceptance',base:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),entries};
fs.writeFileSync(path.join(out,'snapshot.json'),JSON.stringify(snapshot,null,2)+'\n');
execFileSync('python3',['-c',String.raw`
import json,sys,zipfile,os,zlib,hashlib
root,out=sys.argv[1:]
snapshot=json.load(open(os.path.join(out,'snapshot.json'))); cap=27000000
packs=[];archive=None;used=0
try:
 for row in snapshot['entries']:
  name=row['file'];data=open(os.path.join(root,name),'rb').read()
  if hashlib.sha256(data).hexdigest()!=row['sha256']:raise RuntimeError('Source changed '+name)
  estimated=len(zlib.compress(data,6))+len(name.encode())*2+1024
  if estimated>cap:raise RuntimeError('Single file exceeds pack budget '+name)
  if archive is None or used+estimated>cap:
   if archive:archive.close()
   target=os.path.join(out,'CF-review-part-%02d.zip'%(len(packs)+1));archive=zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6);packs.append(target);archive.writestr('REVIEW_SNAPSHOT.json',json.dumps(snapshot,indent=2)+'\n');used=os.path.getsize(target)+4096
  archive.writestr(name,data);used+=estimated
finally:
 if archive:archive.close()
receipt=[]
for target in packs:
 with zipfile.ZipFile(target) as z:
  if z.testzip() is not None:raise RuntimeError('Corrupt zip')
 size=os.path.getsize(target)
 if size>=30000000:raise RuntimeError('30MB cap exceeded')
 receipt.append({'path':target,'bytes':size,'sha256':hashlib.sha256(open(target,'rb').read()).hexdigest()})
json.dump({'scope':snapshot['scope'],'base':snapshot['base'],'files':len(snapshot['entries']),'parts':receipt},open(os.path.join(out,'receipt.json'),'w'),indent=2)
`,root,out],{stdio:'inherit'});
console.log(fs.readFileSync(path.join(out,'receipt.json'),'utf8'));
