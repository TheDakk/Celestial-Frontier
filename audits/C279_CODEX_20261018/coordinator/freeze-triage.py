"""Freeze actual completed film membership then invoke unchanged C261 checker."""
import hashlib,json,os,subprocess,sys
from pathlib import Path
B=Path(__file__).resolve().parent;out=B/sys.argv[1];assert not out.exists();out.mkdir()
read=lambda p:json.loads(Path(p).read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
basepath=Path('audits/C275_CODEX_20261017/coordinator/triage-oyster-finished/freeze.json');base=read(basepath);oldroots=read(basepath.parent/'roots.json');assert base['filmCount']==392 and len(base['pins'])==784
for x in base['pins']:assert sha(x['file'])==x['sha256'],x['file']
frames=['turn1-hit-reaction-50','turn2-dodge-reaction-50','turn3-hit-reaction-50','turn3-hit-idle-50','turn3-hit-idle-90'];new=list(sys.argv[2:]);assert new and len(new)==len(set(new))
for x in new:
 p=Path(x);r=read(p/'report.json');assert r['status']=='DIAGNOSTIC_PASS',x
 assert all((p/(f+'.png')).is_file()for f in frames),x
roots=oldroots+sorted(set(str(Path(x).parent)for x in new));assert len(roots)==len(set(roots))
expanded=[]
for root in roots:
 for p in Path(root).iterdir():
  if p.is_dir()and(p/'report.json').exists()and all((p/(f+'.png')).exists()for f in frames[-2:]):expanded.append(str(p))
expected=set(base['films']+new);accept=lambda xs:len(xs)==len(set(xs))and set(xs)==expected
assert accept(expanded),'Accidental failed/planned/nested/stale membership'
assert not accept(expanded[:-1])and not accept(expanded+[expanded[0]])and not accept(expanded+['MUTANT'])
pins=[dict(file=str(Path(x)/(f+'.png')),sha256=sha(Path(x)/(f+'.png')))for x in sorted(expanded)for f in frames[-2:]]
checker=Path('audits/C243_ALLOUT_20261011/review/fragment-check.mjs');params=dict(W=1024,H=576,T=60,MIN_PX=40,FRAG_MAX=.08,GAP=6)
frozen=dict(status='FROZEN_BEFORE_MEASUREMENT',baseFilms=392,baseFreeze=dict(path=str(basepath),sha256=sha(basepath)),checker=dict(path=str(checker),sha256=sha(checker)),newFilms=new,filmCount=len(expanded),films=sorted(expanded),pins=pins,params=params,otherUnchangedParams=dict(DIL=1,BOX=0,PINK_RG=45,PINK_BG=30,PINK_FLAG=100),membershipControls=dict(status='PASS',positive=1,rejectedMutants=3))
(out/'freeze.json').write_text(json.dumps(frozen,indent=2)+'\n');(out/'roots.json').write_text(json.dumps(roots,indent=2)+'\n')
env=dict(os.environ,FRAMES=','.join(frames[-2:]),W='1024',T='60',MIN_PX='40',GAP='6',DIL='1',BOX='0',PINK_RG='45',PINK_BG='30',PINK_FLAG='100')
r=subprocess.run(['node',str(checker),str(out/'fragment-triage.json'),*roots],env=env,capture_output=True,text=True);(out/'checker.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
q=read(out/'fragment-triage.json');assert q['params']==params;assert set(x['film']for x in q['rows'])==expected
for x in pins:assert sha(x['file'])==x['sha256']
current=[x for x in q['rows']if x['film']in new];(out/'current-rows.json').write_text(json.dumps(current,indent=2)+'\n')
v=dict(status='PASS',frozenFilmCount=len(expanded),currentFilms=len(new),freezeSha256=sha(out/'freeze.json'),triageSha256=sha(out/'fragment-triage.json'),pinsUnchanged=len(pins),currentRows=current,checkerUnmodified=sha(checker)==frozen['checker']['sha256'])
(out/'verification.json').write_text(json.dumps(v,indent=2)+'\n');print(json.dumps(dict(status='PASS',films=len(expanded),current=len(new),pins=len(pins))))
