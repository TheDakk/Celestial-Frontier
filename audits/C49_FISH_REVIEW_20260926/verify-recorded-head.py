from pathlib import Path
import json,hashlib,subprocess
root=Path.cwd();d=root/'audits/C49_FISH_REVIEW_20260926';sibling=Path('/Users/nick/Projects/celestial-frontier-anthropic-mac');base=Path('audits/G1_AUTO_AUTHOR_20260926/weld-g2fam-fish/pairs');sha=lambda b:hashlib.sha256(b).hexdigest();report=json.loads((root/base/'07-perch-final/native/report.json').read_text());head=report['source'];tracked=set(subprocess.check_output(['git','ls-tree','-rz','--name-only',head]).decode().split('\0'))
rows=[]
for r in report['sources']:
 rel=str(Path(r['path']).relative_to(sibling))
 if rel in tracked:rows.append((rel,r['sha256']))
proc=subprocess.run(['git','cat-file','--batch'],input=''.join(head+':'+p+'\n' for p,_ in rows).encode(),stdout=subprocess.PIPE,check=True);data=proc.stdout;pos=0;checks=[]
for rel,expected in rows:
 end=data.index(b'\n',pos);header=data[pos:end].split();size=int(header[2]);body=data[end+1:end+1+size];pos=end+size+2;checks.append({'path':rel,'expected':expected,'recordedHeadSha256':sha(body),'matches':sha(body)==expected})
result={'schema':'cf.c49-native-recorded-head/v1','head':head,'signedCommit':subprocess.check_output(['git','log','-1','--format=%H %G?',head]).decode().strip(),'trackedSourceCount':len(checks),'allTrackedMatch':all(x['matches'] for x in checks),'checks':checks,'scope':'One shared native producer inventory at recorded head; ignored inputs and dependencies are separately hashed, not asserted Git-durable.'}
(d/'native-recorded-head.json').write_text(json.dumps(result,indent=2)+'\n');print('tracked',len(checks),'matches',result['allTrackedMatch'],'mismatches',[x['path'] for x in checks if not x['matches']])
