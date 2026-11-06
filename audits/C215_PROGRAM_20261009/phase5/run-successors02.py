"""Run only after phase4 is signed and phase5 source controls pass, under lock.
Native needs external-browser execution; each changed stage runs once.
"""
from pathlib import Path
import subprocess,json,sys,hashlib
b=Path('audits/C215_PROGRAM_20261009/phase5');rows=json.loads((b/'cases.json').read_text());stage=sys.argv[1];assert stage in ['static','native'];out=b/'successors02';out.mkdir(exist_ok=True)
summary=out/'summary.json';results=json.loads(summary.read_text()) if summary.exists() else []
byid={x['id']:x for x in results};pilot=json.loads(Path('audits/G1_AUTO_AUTHOR_20260926/pilots/sweep3.json').read_text());names={x['id']:json.loads((Path(x['packet'])/'subject-source.json').read_text())['name'] for x in pilot}
def save():summary.write_text(json.dumps(results,indent=2)+'\n')
def run(args,log):
 with log.open('w') as f:r=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT)
 return r.returncode
for source in rows:
 if source['id'] in ['c213originals-21-auk','c213originals-28-kookaburra','c213originals-29-osprey','g2c72-12-egret','g2c95-23-springtail']:continue
 id=source['id'];d=out/id;r=byid.get(id)
 if stage=='static':
  if r:continue
  r={**source,'name':names[id],'status':'PENDING'};results.append(r);byid[id]=r
  if id=='c213originals-14-red-fox':
   replacement=b/'redfox-selected.json'
   if not replacement.exists():r.update(status='HOLD_NO_UNCHANGED_NATIVE_RETRY',reason='Known layered gait compression; observed wrist/paw correction must independently pass pixel/static checks before a changed native attempt.');save();continue
   chosen=json.loads(replacement.read_text());r.update(sourceFit=chosen['fit'],observedForelegCorrection=chosen)
  if id=='g2c95-23-springtail':
   replacement=b/'springtail-selected.json'
   if not replacement.exists():r.update(status='HOLD_REAUTHOR_NOT_QUALIFIED',reason='Wingless canonical re-authoring must produce a passing fit before this case.');save();continue
   chosen=json.loads(replacement.read_text());r.update(sourceFit=chosen['fit'],winglessReauthor=chosen)
  d.mkdir(exist_ok=False);fit=d/'fit'
  r['joinExit']=run(['node',str(b/'source-joins02.mjs'),r['sourceFit'],str(fit)],d/'joins.log');r['fit']=str(fit)
  if r['joinExit']!=0:r['status']='JOIN_REFUSED';save();print(id,r['status'],flush=True);continue
  report=d/'static.json';r['staticExit']=run(['node','audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs',str(fit),str(report)],d/'static.log')
  r['static']=json.loads(report.read_text()).get('status') if report.exists() else 'NO_REPORT';r['status']='STATIC_PASS_NATIVE_PENDING' if r['staticExit']==0 and r['static']=='PASS_STATIC' else 'STATIC_REFUSED';save();print(id,r['status'],flush=True)
 else:
  if not r or r['status']!='STATIC_PASS_NATIVE_PENDING':continue
  script=json.loads(Path('audits/C215_PROGRAM_20261009/phase2/hippo-native-script.json').read_text());script['supports']='observed'
  for turn in script['rows']:
   for key in ['an','dn']:
    if key in turn:turn[key]=r['name']
  scriptFile=d/'native-script.json';scriptFile.write_text(json.dumps(script,indent=2)+'\n');native=d/'native';assert not native.exists(),native
  r['nativeExit']=run(['node','port/v2/tools/battle2-proof/native-runner.mjs',r['fit'],r['fit'],str(native),str(scriptFile)],d/'native.log')
  report=json.loads((native/'report.json').read_text()) if (native/'report.json').exists() else {};r['native']=report.get('status','NO_REPORT');r['nativeDir']=str(native)
  if r['nativeExit']==0 and r['native']=='DIAGNOSTIC_PASS':
   for x in report['sources']:assert hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['sha256'],x['path']
   r.update(status='NUMERIC_PASS_VISUAL_REVIEW_PENDING',nativeSourceHashes='ALL_VERIFIED',frames=report['capture']['frames'])
  else:r.update(status='NATIVE_REFUSED',error=report.get('error'))
  save();print(id,r['status'],flush=True)
