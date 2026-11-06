/** Opt-in diagnostic source admission. Never substitutes an unmeasured fit. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (ok, message) => { if (!ok) throw Error('Fish repair source: '+message); };
export function admitFishSeamSource({id, score, report, provenance, subject, subjectBytes, master, pattern, autoRoot}) {
 need(score.id===id && provenance.subject===id, 'subject id');
 need(score.family==='fish' && subject.family==='fish' && report.family==='fish', 'fish family');
 need(score.verdict==='ADMIT' && provenance.verdict==='ADMIT', 'author admitted');
 need(score.semanticPresence?.startsWith('RESOLVED:') && provenance.presence?.semantic?.startsWith('RESOLVED:'), 'semantic inventory resolved');
 need(score.static==='PASS_STATIC' && report.status==='PASS_STATIC', 'full static pass');
 need(report.rows?.length>0 && report.rows.every(r=>r.status==='PASS') && report.presentation?.status==='PASS', 'complete static outcomes');
 need(['PASS','NOT_REQUIRED'].includes(pattern.status), 'pattern gate');
 const masterHash=sha256(master);
 need(provenance.targetMasterSha256===masterHash, 'exact original master');
 need(pattern.masterSha256===masterHash && pattern.name===subject.name, 'pattern bound to master');
 need(provenance.subjectSourceSha256===sha256(subjectBytes), 'exact subject record');
 need(provenance.identity?.name===subject.name, 'canonical subject name');
 const records=(report.inputs??[]).filter(r=>path.basename(r.path)==='record.json');
 need(records.length===1, 'one measured record');
 const fit=path.dirname(records[0].path),relative=path.relative(path.resolve(autoRoot),path.resolve(fit));
 need(relative && relative!=='..' && !relative.startsWith('..'+path.sep) && !path.isAbsolute(relative), 'fit inside explicit author root');
 need(['binding.json','parts/manifest.json','parts/keyed.png'].every(name=>report.inputs.filter(pin=>pin.path===path.join(fit,name)).length===1) && report.inputs.some(pin=>path.dirname(pin.path)===path.join(fit,'parts/atlas')), 'complete measured input inventory');
 for(const pin of report.inputs){need(pin.unchanged===true && typeof pin.sha256==='string' && fs.existsSync(pin.path) && sha256(fs.readFileSync(pin.path))===pin.sha256, 'measured input hash: '+path.basename(pin.path));}
 const record=JSON.parse(fs.readFileSync(path.join(fit,'record.json'))),binding=JSON.parse(fs.readFileSync(path.join(fit,'binding.json'))),declaration=JSON.parse(fs.readFileSync(path.join(fit,'declaration.json')));
 need(record.template?.id==='fish' && record.identity?.earthName===subject.name && record.geometry?.cutoutAssetHash===masterHash && record.identity?.speciesVisualKey===subject.visualKey, 'record identity/master');
 need(report.recordRecipeHash===record.recipeHash && report.bindingHash===binding.bindingHash, 'measured record/binding');
 need(declaration.schema==='cf.authored-part-masks/v1', 'original polygon ownership; no double repair');
 return {fit,record,masterHash,recordSha256:records[0].sha256,bindingHash:binding.bindingHash,scope:'Diagnostic repair only; original anatomy/visual holds remain'};
}
