import json,pathlib,subprocess
b=pathlib.Path('audits/C243_ALLOUT_20261011/execution/seam-repair-c371');rows=[{'name':g['name'],'fit':str(b/'candidate02'/g['name'].replace(' ','-')/'fit')}for g in json.loads((b/'guides02-aquatic.json').read_text())]+[{'name':g['name'],'fit':g['fit']}for g in json.loads((b/'bird-placement-results.json').read_text())if g['exitCode']==0];rr=[]
for r in rows:
 d=pathlib.Path(r['fit']).parent;report=d/'static.json';assert not report.exists()
 with(d/'static.log').open('x')as f:p=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',r['fit'],str(report)],stdout=f,stderr=subprocess.STDOUT,timeout=900)
 data=json.loads(report.read_text());rr.append({**r,'status':data['status'],'exitCode':p.returncode});(b/'static-results02.json').write_text(json.dumps(rr,indent=2)+'\n');print(r['name'],data['status'],flush=True)
