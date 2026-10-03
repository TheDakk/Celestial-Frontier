from pathlib import Path
import subprocess,hashlib,gzip,json,datetime
r=Path(__file__).resolve().parents[2];a=Path(__file__).resolve().parent

def git(*args):return subprocess.check_output(['git',*args],cwd=r)
def sha(b):return hashlib.sha256(b).hexdigest()
assert git('rev-parse','--show-toplevel').decode().strip()==str(r)
assert git('branch','--show-current').decode().strip()=='openai/mac'
assert git('rev-parse','--abbrev-ref','@{upstream}').decode().strip()=='origin/openai/mac'
head=git('rev-parse','HEAD').decode().strip();assert head=='837db4aaa0ef5d3d8bffc79c70f62dcc2503032d'
manifest=json.loads((a/'manifest.json').read_text());verified=0
for file in manifest['files']:
    b=git('show',':'+file['path'])
    assert len(b)==file['bytes'] and sha(b)==file['sha256'],file['path']
    assert (r/file['path']).read_bytes()==b,file['path']
    verified+=1
whitespace=subprocess.run(['git','diff','--cached','--check','--','.',':(exclude)audits/**'],cwd=r,capture_output=True,text=True)
expected='port/v2/packages/art/src/earth-resident-plan.ts:86: new blank line at EOF.\n'
assert whitespace.returncode==2 and whitespace.stdout==expected and whitespace.stderr=='',whitespace
plan=(r/'port/v2/packages/art/src/earth-resident-plan.ts').read_bytes()
assert plan.endswith(b'\n\n') and not plan.endswith(b'\n\n\n')
supplemental=[]
for name in ['RECOVERY_WHITESPACE_NOTE.md','checkpoint-staged-with-whitespace-note.py']:
    path=a/name;relative=path.relative_to(r).as_posix();b=path.read_bytes()
    assert git('show',':'+relative)==b,relative
    supplemental.append({'path':relative,'bytes':len(b),'sha256':sha(b)})
unstaged=git('diff','--name-only').decode().splitlines();assert not unstaged,unstaged
untracked=git('ls-files','--others','--exclude-standard').decode().splitlines();assert untracked==['.DS_Store'],untracked
prior=[]
for name in ['painted-mars-composition','painted-mars','earth-material','earth-turn','painted-direction','charm-study']:
    p=r/f'port/v2/apps/game/smoke/{name}-staged-20260908.json';j=json.loads(p.read_text())
    b=Path(j['patch']).read_bytes();raw=gzip.decompress(b)
    assert len(b)==j['gzipBytes'] and sha(b)==j['gzipSha256']
    assert len(raw)==j['rawBytes'] and sha(raw)==j['rawSha256']
    prior.append({'receipt':str(p),'gzipSha256':sha(b),'rawSha256':sha(raw),'unchanged':True})
raw=git('diff','--cached','--binary','--full-index');compressed=gzip.compress(raw,compresslevel=9,mtime=0)
assert gzip.decompress(compressed)==raw
p=r/'port/v2/apps/game/smoke/earth-layered-staged-20260908.patch.gz';jpath=p.with_name('earth-layered-staged-20260908.json')
assert not p.exists() and not jpath.exists()
with p.open('xb') as f:f.write(compressed)
assert sha(p.read_bytes())==sha(compressed)
record={'status':'LOCAL_STAGED_RECOVERY_VERIFIED','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
'root':str(r),'app':'Codex','host':'macOS','branch':'openai/mac','head':head,
'aheadBehind':git('rev-list','--left-right','--count','HEAD...origin/openai/mac').decode().strip(),
'stagedFiles':len(git('diff','--cached','--name-only','-z').split(b'\0'))-1,
'rawBytes':len(raw),'rawSha256':sha(raw),'gzipBytes':len(compressed),'gzipSha256':sha(compressed),'patch':str(p),
'earthLayeredManifestSha256':sha((a/'manifest.json').read_bytes()),'manifestCarriersVerified':verified,
'codeWhitespace':{'status':'WARN','exitCode':2,'finding':expected.strip(),'sourceBytesUnchanged':True,'scope':'Formatting finding retained; backup integrity only, no style PASS or qualification waiver'},'supplementalCarriers':supplemental,'unstagedTracked':unstaged,'untracked':untracked,'priorRecoveriesVerified':prior,
'signing':'Previous 1Password failed to fill whole buffer; restoration evidence absent, no retry or unsigned fallback',
'budget':'UNFROZEN/PUBLIC; private fallback 3000; exact hosted authority 0','hostedAttempts':0,'humanArtAcceptance':False,
'next':'Continue approved painted creature richness and species-appropriate animation after reviewing this bounded layered scene; preserve biome compatibility, Earth identity and current UI layout. Codex owns openai/mac. Claude need not open or sync now. No GitHub step/PR or release.'}
with jpath.open('x') as f:json.dump(record,f,indent=2);f.write('\n')
print(json.dumps({k:record[k] for k in ['status','stagedFiles','rawBytes','rawSha256','gzipBytes','gzipSha256','manifestCarriersVerified','unstagedTracked','untracked']}))
