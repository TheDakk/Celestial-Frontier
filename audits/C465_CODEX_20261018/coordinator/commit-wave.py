"""Own-lane signed local wave commit with exact staged-byte proof; no remote operation."""
from pathlib import Path
import subprocess,sys,json,hashlib
proof=Path(sys.argv[1]);message=Path(sys.argv[2]);listing=Path(sys.argv[3]);base=Path.cwd()
run=lambda *a:subprocess.check_output(a)
assert run('git','branch','--show-current').decode().strip()=='openai/mac'
staged=run('git','diff','--cached','--name-only','-z').decode().split('\0')[:-1]
allowed=set(listing.read_text().splitlines()+[str(proof)])
assert set(staged)<=allowed,'Unexpected pre-staged changes'
paths=listing.read_text().splitlines();assert len(paths)==len(set(paths)) and paths
for p in paths:
 assert p.startswith('audits/C465_CODEX_20261018/') or p in ['.gitattributes','ROADMAP.md','ROADMAP_ARCHIVE.md','UI_TOOLCHAIN.md','audits/MAILBOX/TO_CLAUDE.md'],p
 assert Path(p).is_file() and not Path(p).is_symlink(),p
subprocess.run(['git','add','--',*paths],check=True)
changed=run('git','diff','--cached','--name-only','-z').decode().split('\0')[:-1]
rows=[]
for p in changed:
 d=Path(p).read_bytes();blob=run('git','show',':'+p);assert d==blob,p
 rows.append({'path':p,'sha256':hashlib.sha256(d).hexdigest(),'bytes':len(d)})
proof.write_text(json.dumps({'status':'PASS_EXACT_STAGED_BYTES','rows':rows,'files':len(rows),'remoteOperations':False},indent=2)+'\n')
subprocess.run(['git','add','--',str(proof)],check=True)
checked=[r['path']for r in rows if Path(r['path']).suffix not in ['.log','.diff']]
# Retained verbatim tool logs and patch evidence contain intentional trailing whitespace.
subprocess.run(['git','diff','--cached','--check','--',*checked],check=True)
subprocess.run(['git','commit','-S','-F',str(message)],check=True)
head=run('git','rev-parse','HEAD').decode().strip();signature=run('git','log','-1','--format=%G?').decode().strip();assert signature=='G',signature
for r in rows:assert hashlib.sha256(run('git','show',head+':'+r['path'])).hexdigest()==r['sha256'],r['path']
print(json.dumps({'head':head,'signature':signature,'stageProof':str(proof),'files':len(rows),'remoteOperations':False}))
