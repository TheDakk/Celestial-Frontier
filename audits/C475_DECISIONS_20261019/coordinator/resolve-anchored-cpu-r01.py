"""Hand reconcile three specific audit-copy conflicts; production is untouched."""
from pathlib import Path
import hashlib,json,shutil
B=Path('audits/C475_DECISIONS_20261019/coordinator');I=B/'anchored-composed-cpu-r05';O=B/'anchored-resolved-cpu-r01';assert not O.exists();O.mkdir()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();j=json.loads((I/'composition.json').read_text());rows=[]
for r in j['rows']:
 p=Path(r['copy']);assert sha(p)==r['sha256'];text=p.read_text();parts=[];at=0;blocks=[]
 while '\n<<<<<<< ' in '\n'+text[at:]:
  start=text.index('<<<<<<< ',at);middle=text.index('=======\n',start);end=text.index('>>>>>>> ',middle);after=text.index('\n',end)+1
  left=text[text.index('\n',start)+1:middle];right=text[middle+8:end]
  if r['path'].endswith('/source-profile-layouts.mjs'):replacement=left+right
  elif r['path'].endswith('/intake-authored.mjs'):
   if 'const split='in left:
    assert "author.family==='ctenophore-body'"in left and "author.family==='anchored-soft-polyp'"in right
    replacement=left.replace("author.family==='ctenophore-body'","['ctenophore-body','anchored-soft-polyp'].includes(author.family)")
   else:replacement=left+right
  elif r['path'].endswith('/specialized-templates.mjs'):
   marker='export const SPECIALIZED_TEMPLATES=freeze({\n';assert left.count(marker)==right.count(marker)==1
   a,b=left.split(marker);c,d=right.split(marker);replacement=a+c+marker+b+d
  else:raise AssertionError(r['path'])
  parts.extend([text[at:start],replacement]);blocks.append({'left':left,'right':right,'replacement':replacement});at=after
 parts.append(text[at:]);resolved=''.join(parts);assert not any(x in resolved for x in ['<<<<<<< ','\n=======\n','>>>>>>> '])
 dest=O/'proposal'/r['path'];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(resolved)
 if blocks:
  evidence=O/'merge-evidence'/(Path(r['path']).name+'.conflict.diff');evidence.parent.mkdir(exist_ok=True);evidence.write_bytes(p.read_bytes())
 rows.append({'path':r['path'],'beforeSha256':r['currentSha256'],'copy':str(dest),'sha256':sha(dest),'conflictsResolved':len(blocks),'resolution':blocks})
(O/'manifest.json').write_text(json.dumps({'status':'AUDIT_ONLY_RESOLVED_REQUIRES_CPU_INTEGRATION_CHECKS','sourceComposition':j,'rows':rows,'productionEdits':False,'native':False,'AI':False},indent=2)+'\n')
print(json.dumps({'files':len(rows),'conflictsResolved':sum(r['conflictsResolved']for r in rows),'productionEdits':False}))
