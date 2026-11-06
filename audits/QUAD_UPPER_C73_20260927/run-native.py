import pathlib,subprocess,os,json
repo=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(__file__).resolve().parent;rows=[]
for name in ['marmot','cattle']:
 fit=out/(name+'-upper-01/fit');target=out/('native-'+name);assert not target.exists()
 with (out/('native-'+name+'.log')).open('w') as f:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(target),str(out/(name+'-script.json'))],cwd=repo/'port/v2',env={**os.environ,'CF_CPU_THROTTLE':'4'},stdout=f,stderr=subprocess.STDOUT)
 rows.append({'name':name,'exitCode':r.returncode});(out/'native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(name,r.returncode,flush=True)
