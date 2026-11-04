from pathlib import Path
import json,hashlib
B=Path('audits/C270_CODEX_20261017');S=set()
for p in(B/'coordinator').iterdir():
 if p.is_file() and p.suffix in ['.json','.py','.mjs','.log'] and p.name not in ['producer-02-files.json','producer-02-files.txt']:S.add(p)
for folder in ['coordinator/finishes','coordinator/finished-triage']:
 for p in(B/folder).rglob('*'):
  if p.is_file()and p.suffix not in ['.rgba','.webm','.safetensors','.bin','.pt','.pth']:
   if p.suffix=='.png'and p.parent.name=='native'and p.stem not in ['turn1-hit-reaction-50','turn2-dodge-reaction-50','turn3-hit-reaction-50','turn3-hit-idle-50','turn3-hit-idle-90']:continue
   S.add(p)
for slug in ['c270-hoatzin-01','c270-kookaburra-01','c270-pheasant-01']:
 for p in(B/'w2-checkpoint/reviews'/slug).rglob('*'):
  if p.is_file():S.add(p)
for p in(B/'w4-delivery/finished-frilled').rglob('*'):
 if p.is_file() and p.name not in ['status.json','initial-status.json']:S.add(p)
S.update([B/'w4-delivery/prepare-finished-review.mjs',B/'w3-finished/prepare-review.mjs'])
m=json.loads((B/'w4-delivery/manifest-source-batch.json').read_text());rs=m.get('files',m.get('rows',[]));assert rs
for r in rs:
 p=Path(r.get('path',r.get('file')));assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'];S.add(p)
for p in(B/'w4-delivery/source-batch').iterdir():
 if p.is_file():S.add(p)
S.add(B/'w4-delivery/manifest-source-batch.json')
rows=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in sorted(S)];(B/'coordinator/producer-02-files.json').write_text(json.dumps({'status':'SIGNED_BARRIER_PENDING','files':rows,'totalBytes':sum(r['bytes']for r in rows)},indent=2)+'\n');(B/'coordinator/producer-02-files.txt').write_text('\n'.join([r['path']for r in rows]+[str(B/'coordinator/producer-02-files.json'),str(B/'coordinator/producer-02-files.txt')])+'\n');print(json.dumps({'files':len(rows),'MiB':sum(r['bytes']for r in rows)/2**20}))
