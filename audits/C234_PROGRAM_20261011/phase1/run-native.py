from pathlib import Path
import json,subprocess
b=Path('audits/C234_PROGRAM_20261011/phase1');rows=[]
for s in json.loads((b/'subjects.json').read_text()):
 fit=b/('rebound-new' if 'joined-fit' in s['fit'] else 'rebound-retained')/s['id'];out=b/'native'/s['id'];out.parent.mkdir(exist_ok=True);script=Path('audits/AI_FINISH_SWEEP6_20261011/scripts')/(s['id']+'-script.json')
 with (out.parent/(s['id']+'.log')).open('w') as log:r=subprocess.run(['node','port/v2/tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(out),str(script)],stdout=log,stderr=subprocess.STDOUT)
 report=json.loads((out/'report.json').read_text()) if (out/'report.json').exists() else {};rows.append({'id':s['id'],'fit':str(fit),'exit':r.returncode,'status':report.get('status','NO_REPORT')});(b/'native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(rows[-1],flush=True)
