from pathlib import Path
import json,hashlib
B=Path('audits/C270_CODEX_20261017');root=Path.cwd();S=set()
for p in(B/'coordinator').iterdir():
 if p.is_file()and p.suffix in ['.py','.mjs','.json','.log']and p.name not in ['resumption-files.json','resumption-files.txt']:S.add(p)
for slug in ['hoatzin','kookaburra','pheasant']:
 S.add(B/'coordinator/finishes'/slug/'finished/result.json')
 for p in(B/'coordinator/finishes'/(slug+'-signed-r02')).iterdir():
  if p.is_file():S.add(p)
m=json.loads((B/'w2-checkpoint/review-hash-manifest.json').read_text());assert isinstance(m,list)
for r in m:
 p=Path(r['path']);p=p if p.is_absolute()else root/p;assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'],p
 if p.is_relative_to(root/B):S.add(p.relative_to(root))
for folder in ['w2-checkpoint','w2-aquatic','w3-finished']:
 for p in(B/folder).rglob('*'):
  if p.is_file()and p.suffix in ['.py','.mjs','.json','.md','.txt','.log']:S.add(p)
for p in(B/'w4-delivery/finished-frilled').iterdir():
 if p.is_file():S.add(p)
rows=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in sorted(S)];(B/'coordinator/resumption-files.json').write_text(json.dumps({'status':'FROZEN_FINAL_PAPERWORK_AND_CLEAN_RESUMPTION','files':rows,'totalBytes':sum(r['bytes']for r in rows)},indent=2)+'\n');(B/'coordinator/resumption-files.txt').write_text('\n'.join([r['path']for r in rows]+[str(B/'coordinator/resumption-files.json'),str(B/'coordinator/resumption-files.txt')])+'\n');print(json.dumps({'files':len(rows),'MiB':sum(r['bytes']for r in rows)/2**20}))
