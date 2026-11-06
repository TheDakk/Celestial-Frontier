from pathlib import Path
import json,subprocess,shutil
b=Path('audits/C213_PROGRAM_20261004');rows=[]
for r in json.load(open(b/'phase4-fringe-build.json')):
 if r.get('static')!=0:continue
 id=r['id'];script=b/'phase4-fringe'/id/'script.json';shutil.copyfile(Path('audits/G1_AUTO_AUTHOR_20260926/native-sweep2')/(id+'-script.json'),script)
 p=subprocess.run(['node','tools/with-toolchain-lock.mjs','--label','C213-fringe-'+id,'--','node','port/v2/tools/battle2-proof/native-runner.mjs',r['fit'],r['fit'],str(b/('native-fringe-'+id)),str(script)],capture_output=True,text=True)
 (b/(id+'-native-fringe.log')).write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));row={'id':id,'exit':p.returncode};rows.append(row);(b/'phase4-native-fringe.json').write_text(json.dumps(rows,indent=2)+'\n');print(row,flush=True)
 if p.returncode:break
