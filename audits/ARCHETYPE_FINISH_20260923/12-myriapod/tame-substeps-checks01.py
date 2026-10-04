import pathlib, json, hashlib, subprocess, time
root=pathlib.Path(__file__).resolve().parents[3];base=pathlib.Path(__file__).resolve().parent
prior=json.loads((base/'travel-substeps-tests-01.sources.json').read_text())
files={row['file'] for row in prior['sources']}
files.update(str(p.relative_to(root)) for p in base.glob('tame-substeps-return-01.*'))
files.update(str((base/name).relative_to(root)) for name in ['fit-11/record.json','fit-11/binding.json','static-contact-diagnosis04.json'])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before={name:sha(root/name) for name in sorted(files)}
commands=[('real-return', ['node',str(base/'tame-substeps-return-01.mjs')],root),('cadence',['npx','vitest','run','apps/game/src/creature-rig-contact-travel-substeps.test.ts'],root/'port/v2'),('swing-control',['npx','vitest','run','apps/game/src/creature-rig-contact-swing-lift.test.ts','-t','omitting the declaration preserves exact former compact refusals'],root/'port/v2')]
results=[]
for name,command,cwd in commands:
 log=base/('tame-substeps-'+name+'-01.log')
 start=time.monotonic()
 with log.open('x') as out: run=subprocess.run(command,cwd=cwd,stdout=out,stderr=subprocess.STDOUT)
 results.append({'name':name,'command':command,'cwd':str(cwd),'exitCode':run.returncode,'elapsedSeconds':time.monotonic()-start,'log':str(log.relative_to(root))})
 print(json.dumps(results[-1]),flush=True)
 if run.returncode: break
rows=[{'file':name,'sha256':value,'afterSha256':sha(root/name),'unchanged':value==sha(root/name)} for name,value in before.items()]
out=base/'tame-substeps-checks01.json'
with out.open('x') as f: json.dump({'scope':'One actual retained return-phase old/new policy comparison, focused cadence file and single affected legacy swing omission test; no other tests/static/ARAP/S2/native/TypeScript.','results':results,'sources':rows},f,indent=2);f.write('\n')
assert all(row['unchanged'] for row in rows)
raise SystemExit(next((row['exitCode'] for row in results if row['exitCode']),0))
