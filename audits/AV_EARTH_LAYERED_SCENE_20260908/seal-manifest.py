from pathlib import Path
import json,hashlib,datetime,subprocess,re
r=Path(__file__).resolve().parents[2];a=Path(__file__).resolve().parent
assert not (a/'manifest.json').exists()
result=json.loads((a/'final-results.json').read_text())
assert result['status']=='SCOPED_IMPLEMENTATION_NATIVE_AND_LOCAL_PREVIEW_PASS'
paths={p.relative_to(r).as_posix() for p in a.rglob('*') if p.is_file()}
assert not any(p.endswith(('.earthtmp','.avtmp')) for p in paths)
for mode in ['phone','desktop','blocked','default']:
 report=json.loads((a/f'native-{mode}-settled/review.json').read_text())
 assert report['status']=='PASS'
 for p,h in report['sources'].items():
  assert hashlib.sha256((r/p).read_bytes()).hexdigest()==h,p
  paths.add(p)
for p in subprocess.check_output(['git','diff','--name-only'],cwd=r,text=True).splitlines():paths.add(p)
for p in subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=r,text=True).splitlines():
 if p!='.DS_Store':paths.add(p)
for p in re.findall(r"'(tests/[^']+\.ts|apps/game/src/[^']+\.ts|packages/art/test/[^']+\.ts)'",(a/'checks-settled.mjs').read_text()):paths.add('port/v2/'+p)
paths.update(['audits/AV_PAINTED_MARS_COMPOSITION_20260908/manifest.json','audits/TOOLCHAIN_STARTUP_20260907/manifest.json','PARALLEL_GIT_PROTOCOL.md','GITHUB_ACTIONS_BUDGET.md','UI_TOOLCHAIN.md','WORLD_GENERATION.md','port/v2/DEVIATIONS.md'])
files=[]
for p in sorted(paths):
 data=(r/p).read_bytes();files.append({'path':p,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
j={'schema':'cf-earth-layered-review-packet/v1','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceParent':result['sourceParent'],'sourceState':'local-staged-successor-signing-pending','status':result['status'],'certification':False,'result':'audits/AV_EARTH_LAYERED_SCENE_20260908/final-results.json','historicalManifests':'Older manifests retain their checkpoint bytes; current references evolve in this successor. Six older binary recoveries remain unchanged.','direction':'Approved rich painted references retained; present resident bodies remain below art target. UI placement and Earth identity preserved.','humanArtAcceptance':False,'hostedAttempts':0,'files':files}
with (a/'manifest.json').open('x') as f:json.dump(j,f,indent=2);f.write('\n')
print(json.dumps({'status':j['status'],'carriers':len(files),'manifestSha256':hashlib.sha256((a/'manifest.json').read_bytes()).hexdigest()}))
