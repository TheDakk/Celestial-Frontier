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
 assert p.startswith(('audits/C475_DECISIONS_20261019/','port/v2/','tools/creature-animation/')) or p in ['.gitattributes','ROADMAP.md','ROADMAP_ARCHIVE.md','UI_TOOLCHAIN.md','MOTION_KIT.md','audits/MAILBOX/TO_CLAUDE.md','audits/G1_AUTO_AUTHOR_20260926/harness/static.ts','audits/C274_ALL170_20261017/w3-wave4/worstpose-r01/exact-retained-context.ts'],p
 assert Path(p).is_file() and not Path(p).is_symlink(),p
subprocess.run(['git','add','--',*paths],check=True)
changed=run('git','diff','--cached','--name-only','-z').decode().split('\0')[:-1]
changed=[p for p in changed if p!=str(proof)]
def batch_blobs(ref,paths):
 data=run('git','cat-file','--batch') if not paths else subprocess.check_output(['git','cat-file','--batch'],input=''.join(ref+':'+p+'\n'for p in paths).encode())
 at=0;out={}
 for p in paths:
  end=data.index(b'\n',at);header=data[at:end].split();assert header[1]==b'blob',p;n=int(header[2]);out[p]=data[end+1:end+1+n];at=end+2+n
 return out
blobs=batch_blobs('',changed);rows=[]
for p in changed:
 d=Path(p).read_bytes();assert d==blobs[p],p
 rows.append({'path':p,'sha256':hashlib.sha256(d).hexdigest(),'bytes':len(d)})
proof.write_text(json.dumps({'status':'PASS_EXACT_STAGED_BYTES','rows':rows,'files':len(rows),'remoteOperations':False},indent=2)+'\n')
subprocess.run(['git','add','--',str(proof)],check=True)
# Eight exact frozen diff3 counterexamples are verbatim historical evidence,
# never production code; reject a changed byte or any broader path exception.
verbatim_freeze=Path('audits/C475_DECISIONS_20261019/w2-worm-radial/integration-staging-r01/freeze-final-r02.json')
verbatim={}
if verbatim_freeze.exists():
 for r in json.loads(verbatim_freeze.read_text())['files']:
  prefix='audits/C475_DECISIONS_20261019/w2-worm-radial/integration-staging-r01/'
  if r['path'].startswith((prefix+'merge-evidence/port/v2/',prefix+'merge-evidence-r02/port/v2/')):
   assert hashlib.sha256(Path(r['path']).read_bytes()).hexdigest()==r['sha256'],r['path']
   verbatim[r['path']]=r['sha256']
 assert len(verbatim)==8,'Exact eight historical merge witnesses only'
checked=[r['path']for r in rows if Path(r['path']).suffix not in ['.log','.diff','.patch'] and r['path'] not in verbatim]
# Retained verbatim tool logs, patches and the eight byte-frozen diff3 witnesses
# are audit data. Every production source keeps the whitespace/conflict check.
subprocess.run(['git','diff','--cached','--check','--',*checked],check=True)
committed=subprocess.run(['git','commit','-S','-F',str(message)],capture_output=True,text=True)
proof.with_suffix('.commit.log').write_text(committed.stdout+committed.stderr)
assert committed.returncode==0,'Commitfailed; retainedlog'
head=run('git','rev-parse','HEAD').decode().strip();signature=run('git','log','-1','--format=%G?').decode().strip();assert signature=='G',signature
committed_blobs=batch_blobs(head,[r['path']for r in rows])
for r in rows:assert hashlib.sha256(committed_blobs[r['path']]).hexdigest()==r['sha256'],r['path']
print(json.dumps({'head':head,'signature':signature,'stageProof':str(proof),'files':len(rows),'remoteOperations':False}))
