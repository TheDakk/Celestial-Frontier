import pathlib,subprocess,json,os
repo=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(__file__).resolve().parent;refs=repo/'audits/G2_REFERENCES_C62_20260927'
cases=[('termite',out/'24-termite/fit',out/'24-termite/script.json'),('ant',refs/'08-ant/fit-01',refs/'08-ant/native-script.json'),('cricket',refs/'09-cricket/fit-01',refs/'09-cricket/native-script.json'),('beetle',repo/'audits/ARCHETYPE_FINISH_20260923/04-insect/fit-04',out/'beetle-script.json')]
script=json.loads((refs/'08-ant/native-script.json').read_text())
for row in script['rows']:row['an']=row['dn']='Beetle'
(out/'beetle-script.json').write_text(json.dumps(script,indent=2)+'\n')
rows=[]
for name,fit,script in cases:
 target=out/('native-'+name);assert not target.exists()
 with (out/('native-'+name+'.log')).open('w') as f:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(target),str(script)],cwd=repo/'port/v2',env={**os.environ,'CF_CPU_THROTTLE':'4'},stdout=f,stderr=subprocess.STDOUT)
 rows.append({'name':name,'exitCode':r.returncode});(out/'native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(name,r.returncode,flush=True)
