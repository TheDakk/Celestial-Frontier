import pathlib,subprocess,sys,json
base=pathlib.Path(__file__).resolve().parent
rows=[]
for slug in sys.argv[1:]:
 plan=pathlib.Path('audits/C270_CODEX_20261017/w2-checkpoint/plans')/slug/'plan.json'
 if slug in ['frilled-lizard-a03','vent-crab-a02-near']: plan=pathlib.Path('audits/C270_CODEX_20261017/w1-source')/slug/'plan.json'
 assert slug not in ['kangaroo','gibbon','vampire-bat','cave-cricket','dragonfish','cassowary','snake']
 r=subprocess.run(['python3',str(base/'run-stage.py'),'first-'+slug,'node','tools/with-toolchain-lock.mjs','--label','C270-'+slug,'--','python3','audits/C266_CODEX_20261017/coordinator/run-native-one.py',str(plan)],capture_output=True,text=True)
 row={'slug':slug,'plan':str(plan),'exitCode':r.returncode,'output':r.stdout[-250:]};rows.append(row);print(json.dumps(row),flush=True)
 if 'Pre-stage headroom' in r.stderr or 'floorTermination' in r.stdout and 'true' in r.stdout: break
out=base/('queue-'+sys.argv[1]+'-'+sys.argv[-1]+'.json');assert not out.exists();out.write_text(json.dumps(rows,indent=2)+'\n')
