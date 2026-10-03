import pathlib,subprocess,os,json
root=pathlib.Path(__file__).resolve().parent;repo=root.parents[1];rows=[]
for id in ['03-duck-v2','04-hawk-v2','05-cat-v2','07-weasel','08-ant','09-cricket']:
 fit=root/id/'fit-01';out=root/id/'native-01';assert not out.exists()
 with (root/id/'native-01.log').open('w') as f:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(out),str(root/id/'native-script.json')],cwd=repo/'port/v2',env={**os.environ,'CF_CPU_THROTTLE':'4'},stdout=f,stderr=subprocess.STDOUT)
 rows.append({'id':id,'exitCode':r.returncode});(root/'remaining-native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(id,r.returncode,flush=True)
