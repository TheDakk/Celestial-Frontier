from pathlib import Path
src=Path('port/v2/tools/battle2-proof/native-runner.mjs').resolve()
s=src.read_text()
def replace(a,b):
 global s
 assert s.count(a)==1,(a,s.count(a));s=s.replace(a,b)
import re
s=re.sub(r"from '([.][^']+)'",lambda m:"from '"+str((src.parent/m[1]).resolve())+"'",s)
replace("import { rolldown } from 'rolldown';", "import {createRequire} from 'node:module'; const require=createRequire("+repr(str(Path('port/v2/package.json').resolve()))+"); const {rolldown}=await import(require.resolve('rolldown'));")
replace("path.resolve(import.meta.dirname, '../../../..')", "process.cwd()")
s=s.replace("import.meta.dirname",repr(str(src.parent)))
replace("transform(_, id) { if (path.isAbsolute(id) && fs.existsSync(id) && fs.statSync(id).isFile()) remember(id); }",'''transform(code, id) {
 if (path.isAbsolute(id) && fs.existsSync(id) && fs.statSync(id).isFile()) remember(id);
 if(!id.endsWith('/apps/game/src/battle2/parts-rig.ts'))return;
 const original=code;
 const replace=(a,b)=>{if(code.split(a).length!==2)throw Error('Unique diagnostic patch required: '+a);code=code.replace(a,b);};
 replace('let pending: RigPose = {},', 'let diagnosticSolved: CreaturePoseV1 | null = null; let pending: RigPose = {},');
 replace('return solved.pose;', 'diagnosticSolved=solved.pose; return solved.pose;');
 replace('pending = pose; frame += 1;', 'diagnosticSolved=null; pending = pose; frame += 1;');
 replace('catch (error) { refused += 1;', "catch (error) { const g=globalThis as any;g.__tailFailures??=[];if(g.__tailFailures.length<100)g.__tailFailures.push(JSON.parse(JSON.stringify({name:record.identity.earthName,recipeHash:record.recipeHash,context,pose:diagnosticSolved,pending,error:String(error)}))); refused += 1;");
 fs.writeFileSync(path.join(out,'instrumented-parts-rig.ts'),code);report.diagnosticTransform={source:sha(original),instrumented:sha(code),scope:'Observe failed resolved poses only; no solver or acceptance changes'};
 return {code,map:null};
 }''')
replace("report.capture = await evaluate('window.cfBattle2Proof.capture()');", "report.capture = await evaluate('window.cfBattle2Proof.capture()'); fs.writeFileSync(path.join(out,'failed-poses.json'),JSON.stringify(await evaluate('window.__tailFailures??[]'),null,2)+'\\n');")
Path('audits/TAIL_STALK_C54_20260926/diagnostic-native-runner.mjs').write_text(s)
