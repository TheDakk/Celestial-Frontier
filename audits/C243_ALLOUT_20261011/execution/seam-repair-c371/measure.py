import json,pathlib,subprocess,sys
rows=json.loads(pathlib.Path(sys.argv[1]).read_text());out=pathlib.Path(sys.argv[2]);assert not out.exists();rr=[]
for r in rows:
 d=pathlib.Path(r['fit']).parent;report=d/'static.json';assert not report.exists()
 with(d/'static.log').open('x')as f:p=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',r['fit'],str(report)],stdout=f,stderr=subprocess.STDOUT,timeout=900)
 data=json.loads(report.read_text());rr.append({**r,'status':data['status'],'exitCode':p.returncode});out.write_text(json.dumps(rr,indent=2)+'\n');print(r['name'],data['status'],flush=True)
