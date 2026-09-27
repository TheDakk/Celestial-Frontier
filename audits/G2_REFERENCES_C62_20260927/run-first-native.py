import pathlib,subprocess,os,json
root=pathlib.Path(__file__).resolve().parent;repo=root.parents[1];rows=[]
for id in ['01-robin','02-pigeon']:
 fit=root/id/'fit-01';out=root/id/'native-01';assert not out.exists()
 with (root/id/'native-01.log').open('w') as f:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(out),str(root/id/'native-script.json')],cwd=repo/'port/v2',env={**os.environ,'CF_CPU_THROTTLE':'4'},stdout=f,stderr=subprocess.STDOUT)
 rows.append({'id':id,'exitCode':r.returncode});(root/'first-native-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(id,r.returncode,flush=True)
