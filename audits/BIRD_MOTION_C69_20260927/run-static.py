import pathlib,subprocess,json
repo=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(__file__).resolve().parent
cases=[('dove',out/'inputs/c56-15-dove'),('vulture',out/'inputs/c59-08-vulture'),('hawk',repo/'audits/G2_REFERENCES_C62_20260927/04-hawk-v2/fit-01'),('pigeon',repo/'audits/G2_REFERENCES_C62_20260927/02-pigeon/fit-01')]
rows=[]
for name,fit in cases:
 report=out/(name+'-static.json');assert not report.exists()
 with (out/(name+'-static.log')).open('w') as f:r=subprocess.run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(fit),str(report)],cwd=repo,stdout=f,stderr=subprocess.STDOUT)
 rows.append({'name':name,'exitCode':r.returncode});(out/'static-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(name,r.returncode,flush=True)
