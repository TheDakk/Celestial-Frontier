import json,subprocess,pathlib
b=pathlib.Path('audits/C243_ALLOUT_20261011/execution/seam-repair-c371');results=[]
for g in json.loads((b/'guides.json').read_text()):
 d=b/'candidate01'/g['name'].replace(' ','-');fit=d/'fit';report=d/'static.json'
 assert not report.exists()
 with (d/'static.log').open('x') as f:p=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(fit),str(report)],stdout=f,stderr=subprocess.STDOUT,timeout=900)
 r=json.loads(report.read_text()) if report.exists()else{};results.append({'name':g['name'],'fit':str(fit),'exitCode':p.returncode,'status':r.get('status','NO_REPORT'),'refusal':r.get('refusal'),'reds':[{'id':x['id'],'refusal':x.get('firstRefusal')}for x in r.get('rows',[])if x['status']!='PASS']});(b/'static-results.json').write_text(json.dumps(results,indent=2)+'\n');print(g['name'],p.returncode,r.get('status'),flush=True)
