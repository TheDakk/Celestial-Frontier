import pathlib,subprocess,os,json
repo=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(__file__).resolve().parent
rows=[]
for name in ['donkey','lynx']:
 fit=out/name/'fit';target=out/name/'native-01';assert not target.exists()
 with (out/name/'native-01.log').open('w') as f:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(target),str(out/name/'script.json')],cwd=repo/'port/v2',env={**os.environ,'CF_CPU_THROTTLE':'4'},stdout=f,stderr=subprocess.STDOUT)
 rows.append({'name':name,'exitCode':r.returncode});(out/'heldout-native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(name,r.returncode,flush=True)
