/** Offline G1 recipe admission. A pin chooses geometry, never a target inventory or a refusal witness.
 * Registry acceptance is the current signed registry's authority; old accepted rows need not carry a literal epoch note.
 * This adapter does not certify a source, execute a gate, modify a seal, or infer absence. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const need=(ok,message)=>{if(!ok)throw Error('kin-pin: '+message);};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const samePath=(a,b)=>path.resolve(a)===path.resolve(b);
function file(root,pin){
 need(pin&&typeof pin.path==='string'&&!path.isAbsolute(pin.path)&&!pin.path.includes('\\')&&!pin.path.includes('\0')&&/^[a-f0-9]{64}$/.test(pin.sha256),'relative file path and SHA-256 required');
 const f=path.resolve(root,pin.path),rel=path.relative(root,f);need(rel&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel),'file outside repository');
 need(fs.existsSync(f)&&fs.statSync(f).isFile(),'pinned file missing: '+pin.path);
 const real=fs.realpathSync(f),realRel=path.relative(fs.realpathSync(root),real);need(realRel&&!realRel.startsWith('..'+path.sep)&&realRel!=='..'&&!path.isAbsolute(realRel),'pinned symlink outside repository');
 const bytes=fs.readFileSync(f);need(sha(bytes)===pin.sha256,'file hash mismatch: '+pin.path);return{path:f,bytes};
}
const json=f=>JSON.parse(f.bytes.toString('utf8'));
export function kinPinArgument(args){
 const pins=args.filter(a=>a.startsWith('--kin-pin='));
 need(!args.some(a=>(a.startsWith('--kin-')&&!a.startsWith('--kin-pin='))||a==='--kin-pin'||a==='--refs'||a.startsWith('--refs=')),'unknown pin/reference option');
 need(pins.length<=1,'one recipe required');if(!pins.length)return null;
 const name=pins[0].slice(10);need(name.length>0,'recipe filename required');
 need(!args.some(a=>/^--(?:shop|fallback|leg-match)(?:=|$)/.test(a)||a==='--skeleton'||a==='--serpent-strips'),'shopping, fallback, leg matching, skeleton and serpent-strip pins unsupported');
 return name;
}
export function admitKinPin({recipe,root,target,pool}){
 need(recipe?.schema==='cf.g1-certified-kin-pin/v1','unsupported recipe schema');
 const t=recipe.target,r=recipe.reference;need(t&&r&&target&&Array.isArray(pool),'target and reference required');
 need(t.id===target.id,'recipe target ID mismatch');
 const targetMaster=file(root,t.master),targetSubject=file(root,t.subject),targetPrompt=file(root,t.prompt);
 need(samePath(targetMaster.path,path.join(target.dir,'master.png'))&&samePath(targetSubject.path,path.join(target.dir,'subject-source.json'))&&samePath(targetPrompt.path,path.join(target.dir,'prompt.txt')),'recipe target files do not belong to this target');
 const ts=json(targetSubject);need(ts.name===target.subject.name&&ts.family===target.family,'target subject identity mismatch');
 const donors=pool.filter(x=>x.id===r.id);need(donors.length===1,'reference missing or ambiguous');const donor=donors[0];
 need(typeof r.name==='string'&&r.name===donor.subject.name,'reference species mismatch');need(r.name!==ts.name,'same species cannot be its own reference');
 need(r.kind===target.family&&r.kind===donor.family&&r.kind===donor.authoring.family,'reference contract kind mismatch');
 const master=file(root,r.master),subject=file(root,r.subject),author=file(root,r.authoring),recordFile=file(root,r.record),reportFile=file(root,r.nativeReport);
 need(samePath(master.path,path.join(donor.dir,'master.png'))&&samePath(subject.path,path.join(donor.dir,'subject-source.json'))&&samePath(author.path,path.join(donor.dir,'authoring.json')),'reference files do not belong to selected packet');
 const ds=json(subject),a=json(author),record=json(recordFile),report=json(reportFile);
 need(report.status==='DIAGNOSTIC_PASS','native report status must be DIAGNOSTIC_PASS');
 need(record.geometry?.cutoutAssetHash===r.master.sha256,'portable record cutoutAssetHash must bind exact donor master bytes');
 need(ds.name===r.name&&ds.family===r.kind&&a.family===r.kind&&JSON.stringify(a)===JSON.stringify(donor.authoring),'reference packet identity/authoring mismatch');
 need(record.kind===r.kind&&record.identity?.earthName===r.name&&record.recipeHash===r.recordRecipeHash&&typeof r.recordRecipeHash==='string'&&r.recordRecipeHash.length>0,'portable record identity/recipe mismatch');
 need(record.provenance?.authoringSha256===r.authoring.sha256&&record.provenance?.subjectSourceSha256===r.subject.sha256,'portable record provenance does not bind exact authoring/subject bytes');
 need(typeof record.source==='string'&&samePath(path.resolve(root,record.source),master.path),'record source does not bind donor master');
 const w=record.geometry?.width,h=record.geometry?.height;need(Number.isFinite(w)&&w>0&&Number.isFinite(h)&&h>0,'record dimensions required');
 const lm=record.landmarks;need(lm&&a.landmarksPx&&Object.keys(lm).length===Object.keys(a.landmarksPx).length&&Object.entries(a.landmarksPx).every(([k,p])=>Array.isArray(lm[k])&&Math.abs(lm[k][0]*w-p[0])<1e-6&&Math.abs(lm[k][1]*h-p[1])<1e-6),'record and authoring landmarks differ');
 need(recipe.registry?.path==='audits/GENERATED_GALLERY_20260927/gallery-registry.json','canonical current registry required');
 const registry=json(file(root,recipe.registry));need(Array.isArray(registry)&&Number.isInteger(r.registryIndex0),'registry row required');const row=registry[r.registryIndex0];
 need(row&&sha(JSON.stringify(row))===r.registryRowSha256&&row.name===r.name,'registry row binding mismatch');
 need(typeof row.note==='string'&&row.note.length>0&&!/^(HELD|FRAGMENTED|unreviewed|SUPERSEDED)/i.test(row.note)&&!/PENDING[- ]CERT/i.test(row.note),'reference must be currently accepted/certified, never held or pending');
 need(typeof row.nativeDir==='string'&&samePath(reportFile.path,path.resolve(root,row.nativeDir,'report.json')),'native report does not belong to certified row');
 // Old reports retain another machine's absolute prefix. Match only the pinned repository-relative audits suffix and exact hash.
 const recordRel=path.relative(root,recordFile.path).split(path.sep).join('/');
 const nativeRecords=(report.sources??[]).filter(s=>typeof s.path==='string'&&s.path.endsWith('/record.json'));
 need(nativeRecords.length===1&&nativeRecords[0].sha256===r.record.sha256&&(nativeRecords[0].path===recordRel||nativeRecords[0].path.endsWith('/'+recordRel)),'native report does not bind the exact portable record');
 return{referenceId:r.id,recipeSha256:sha(JSON.stringify(recipe)),registrySha256:recipe.registry.sha256,registryIndex0:r.registryIndex0,recordSha256:r.record.sha256,meaning:'Geometry donor only; full original refusal witnesses and target anatomy remain authoritative'};
}
