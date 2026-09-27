import pathlib,subprocess,json
repo=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(__file__).resolve().parent
allcases=json.loads((out/'inputs.json').read_text())['cases']
names=['c54-14-goose','c54-15-quail','c56-10-raven','c59-08-vulture','c56-15-dove','02-pigeon']
rows=[]
for name in names:
 fit=repo/next(x[1] for x in allcases if x[0]==name);report=out/(name+'-static.json');assert not report.exists()
 with (out/(name+'-static.log')).open('w') as f:r=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(fit),str(report)],cwd=repo,stdout=f,stderr=subprocess.STDOUT)
 rows.append({'name':name,'exitCode':r.returncode});(out/'static-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(name,r.returncode,flush=True)
