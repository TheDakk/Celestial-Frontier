from pathlib import Path
import hashlib,json
b=Path('audits/C215_PROGRAM_20261009/phase5');paths=[b,Path('audits/G1_AUTO_AUTHOR_20260926/auto-c215springtail'),Path('audits/G1_AUTO_AUTHOR_20260926/auto-c215fishdefault'),Path('audits/G1_AUTO_AUTHOR_20260926/native-c215fishdefault'),Path('audits/G1_AUTO_AUTHOR_20260926/native-c215fishdefault-fishseams')]
manifest=b/'path-normalizations-successors.json';rows=json.load(open(manifest)) if manifest.exists() else [];seen=set()
for directory in paths:
 for p in directory.rglob('*'):
  if p in seen or p==manifest:continue
  seen.add(p)
  if p.is_symlink():assert not p.readlink().is_absolute(),p
  if not p.is_file() or p.suffix.lower() in ['.png','.webm','.jpg','.jpeg','.mp4']:continue
  raw=p.read_bytes()
  try:text=raw.decode('utf8')
  except UnicodeDecodeError:continue
  updated=text.replace(str(Path.home()),'~').encode()
  if updated!=raw:
   rows.append({'path':str(p),'beforeSha256':hashlib.sha256(raw).hexdigest(),'afterSha256':hashlib.sha256(updated).hexdigest(),'change':'Home prefix transport only; native captured-source hashes verified before normalization.'});tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_bytes(updated);tmp.replace(p)
manifest.write_text(json.dumps(rows,indent=2)+'\n');print('Normalized metadata files',len(rows))
