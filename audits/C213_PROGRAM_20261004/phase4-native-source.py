from pathlib import Path
import json,subprocess,shutil
b=Path('audits/C213_PROGRAM_20261004');cases=[r for r in json.load(open(b/'phase4-source-build.json')) if r.get('static')==0]+[r for r in json.load(open(b/'phase4-keyed-build.json')) if r.get('static')==0];rows=[]
for r in cases:
 id=r['id'];fit=Path(r['fit']);src=Path('audits/C210_BACKLOG_UNLOCKS_20261004/seam-inputs')/id/'script.json'
 if not src.exists():
  names={'wild-pig':'07-wild-pig','cow':'10-cow','stork':'16-stork','falcon-c275':'13-falcon'}
  if id in names:src=Path('audits/C208_REPAIRS_20261004/inputs')/names[id]/'script.json'
  elif id=='bee':src=Path('audits/C210_CONTINUATION_20261004/inputs/g2c136targetededits-21-bee/script.json')
  else:src=Path('audits/G1_AUTO_AUTHOR_20260926/native-sweep2')/(id+'-script.json')
 if not src.exists():raise RuntimeError('No exact predecessor script '+str(src))
 script=fit.parent/'script.json';shutil.copyfile(src,script)
 p=subprocess.run(['node','tools/with-toolchain-lock.mjs','--label','C213-source-'+id,'--','node','port/v2/tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(b/('native-source-'+id)),str(script)],capture_output=True,text=True)
 (b/(id+'-native-source.log')).write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));rows.append({'id':id,'class':r['class'],'fit':str(fit),'exit':p.returncode,'noRetry':True});(b/'phase4-native-source.json').write_text(json.dumps(rows,indent=2)+'\n');print(rows[-1],flush=True)
 # Each row is an independent changed source diagnostic. A red ends that source's chain; no downstream acceptance or retry.
