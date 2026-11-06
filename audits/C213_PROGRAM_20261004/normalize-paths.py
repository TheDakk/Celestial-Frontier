from pathlib import Path
import hashlib,json,subprocess
base=Path('audits/C213_PROGRAM_20261004');receipt=base/'path-normalization.json';rows=json.loads(receipt.read_text()) if receipt.exists() else []
files=[Path(s) for s in subprocess.check_output(['git','ls-files','audits/C213_PROGRAM_20261004','audits/G1_AUTO_AUTHOR_20260926/auto-c213p1','audits/G1_AUTO_AUTHOR_20260926/auto-c213p2','audits/G1_AUTO_AUTHOR_20260926/auto-c213p3','audits/G1_AUTO_AUTHOR_20260926/auto-c213p4','audits/G1_AUTO_AUTHOR_20260926/auto-c213p5','audits/G1_AUTO_AUTHOR_20260926/auto-c213p6','audits/G1_AUTO_AUTHOR_20260926/auto-c213p6resume','audits/C213_RESUME_20261009','audits/C213_ORIGINALS_20261004','audits/G1_AUTO_AUTHOR_20260926/auto-c213supply','audits/C213_REFERENCES_20261004'],text=True).splitlines()]
for p in files:
 if p.suffix not in ['.json','.log','.md'] or p==receipt:continue
 b=p.read_bytes();home=str(Path.home()).encode()
 if home not in b:continue
 c=b.replace(home,b'~');rows.append({'file':str(p),'originalSha256':hashlib.sha256(b).hexdigest(),'normalizedSha256':hashlib.sha256(c).hexdigest(),'change':'Home prefix only; all measurements and input hashes unchanged'});t=p.with_suffix(p.suffix+'.tmp');t.write_bytes(c);t.replace(p)
receipt.write_text(json.dumps(rows,indent=2)+'\n');print('path-normalized entries',len(rows))
