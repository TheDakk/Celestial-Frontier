from pathlib import Path
import json,hashlib
B=Path('audits/C270_CODEX_20261017');S=set()
# Only stable producer inputs and the mature signed checkpoint enter this barrier.
for p in (B/'coordinator').iterdir():
 if p.is_file() and p.suffix in ['.py','.mjs','.json','.log']:S.add(p)
for p in (B/'coordinator/paintings').rglob('*'):
 if p.is_file() and p.name not in ['lease-release.json']:S.add(p)
for p in (B/'w1-source').rglob('*'):
 if p.is_file() and not any(x in p.parts for x in ['raw-fit','islands','rgba-control-fit','native']) and p.suffix!='.rgba':S.add(p)
for p in (B/'coordinator/first-triage').rglob('*'):
 if p.is_file():S.add(p)
for planpath in list((B/'w2-checkpoint/plans').glob('*/plan.json'))+[B/'w1-source/frilled-lizard-a03/plan.json',B/'w1-source/vent-crab-a02-near/plan.json']:
 d=json.loads(planpath.read_text())[0];S.add(planpath);S.add(Path(d['script']));rp=Path(d['nativeReport']);S.add(rp)
 for p in rp.parent.iterdir():
  if p.is_file() and(p.suffix in ['.json','.log'] or p.stem in ['turn1-hit-reaction-50','turn2-dodge-reaction-50','turn3-hit-reaction-50','turn3-hit-idle-50','turn3-hit-idle-90']):S.add(p)
 for r in json.loads(rp.read_text())['sources']:
  p=Path(r['path'].replace('~',str(Path.home()),1));rel=p.relative_to(Path.cwd())
  if str(rel).startswith(str(B)+'/'):assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'];S.add(rel)
for p in (B/'coordinator/finishes').rglob('*'):
 if p.is_file():S.add(p)
for p in (B/'w2-checkpoint/reviews/frilled-lizard-a03-01').iterdir():
 if p.is_file():S.add(p)
S.add(Path('audits/GENERATED_GALLERY_20260927/gallery-registry.json'))
# All real originals used by copied packets and their exact authoring inputs.
for parent in (B/'w2-checkpoint/packets').iterdir():
 for p in parent.iterdir():
  if p.is_file() and p.suffix in ['.json','.txt','.png']:S.add(p)
for p in (B/'w2-checkpoint').iterdir():
 if p.is_file():S.add(p)
S.discard(B/'coordinator/producer-files.json');S.discard(B/'coordinator/producer-files.txt')
files=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in sorted(S)];(B/'coordinator/producer-files.json').write_text(json.dumps({'status':'PRODUCER_BARRIER','files':files,'totalBytes':sum(r['bytes']for r in files)},indent=2)+'\n');(B/'coordinator/producer-files.txt').write_text('\n'.join([r['path']for r in files]+[str(B/'coordinator/producer-files.json'),str(B/'coordinator/producer-files.txt')])+'\n');print(json.dumps({'paths':len(files),'MiB':sum(r['bytes']for r in files)/2**20}))
