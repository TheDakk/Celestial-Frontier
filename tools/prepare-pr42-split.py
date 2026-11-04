"""Prepare three exact local review trees; never create branches or publish."""
from pathlib import Path
import subprocess, tempfile, os, json, re, hashlib, sys
ROOT=Path(__file__).resolve().parent.parent
TIERS=('ui','engine','tools')
def git(*args,env=None,data=None):
 return subprocess.check_output(['git',*args],cwd=ROOT,env=env,input=data)
def tier(p):
 name=Path(p).name
 if p.startswith(('audits/','tools/','port/v2/tests/','port/v2/tools/')):
  if p.startswith(('port/v2/tools/creature-animation/','tools/local-image-generation/')) and not ('.test.' in p or name.startswith(('run-','test-'))): return 'engine'
  return 'tools'
 if p.startswith(('port/v2/packages/art/','port/v2/packages/audio/','port/v2/apps/game/src/motion/')):return 'engine'
 if p.startswith('port/v2/apps/game/src/') and (name.startswith(('creature-','anatomy-','landfall-','local-','earth-','painted-','battle-','audio-production-','ai-','kit-','missing-body-','motion-')) or name in ('audiovisual-pilot.ts','procedural-genome-bank.ts')):return 'engine'
 if p in ('CREATURE_ANIMATION.md','LOCAL_AI_GENERATION.md','SPECIES_AND_GENOME.md','UI_TOOLCHAIN.md','AUDIO.md'):return 'engine'
 if p.startswith('port/v2/apps/game/') or p in ('main.js','celestial-frontier.html','UI_PRESENTATION.md'):return 'ui'
 return 'tools'
def entries(ref):
 result={}
 for row in git('ls-tree','-rz',ref).split(b'\0'):
  if not row:continue
  meta,p=row.split(b'\t',1);mode,kind,oid=meta.decode().split();result[p.decode()]=(mode,oid)
 return result
if len(sys.argv)!=2:raise SystemExit('Usage: prepare-pr42-split.py NEW_PACKET')
out=Path(sys.argv[1]).resolve();out.mkdir()
head=git('rev-parse','HEAD').decode().strip();base=git('merge-base','origin/develop',head).decode().strip()
if git('rev-parse','--show-toplevel').decode().strip()!=str(ROOT) or git('branch','--show-current').decode().strip()!='openai/mac':raise RuntimeError('Wrong checkout')
old,new=entries(base),entries(head)
changed=sorted(p for p in old.keys()|new.keys() if old.get(p)!=new.get(p));groups={t:[p for p in changed if tier(p)==t] for t in TIERS}
def complete(g):
 allpaths=sum(g.values(),[])
 if len(allpaths)!=len(set(allpaths)) or set(allpaths)!=set(changed):raise ValueError('Split omissions or duplicate ownership')
complete(groups);controls=[]
for mutation in ('omission','duplicate'):
 g={t:list(v) for t,v in groups.items()};first=next(t for t in TIERS if g[t]);p=g[first][0]
 if mutation=='omission':g[first].remove(p)
 else:g[first].append(p)
 try:complete(g);raise AssertionError('Control passed')
 except ValueError:controls.append({'mutation':mutation,'rejected':True})
receipt={'schema':'cf.local-pr42-split/v1','sourceHead':head,'cachedDevelop':git('rev-parse','origin/develop').decode().strip(),'base':base,'baseBranch':'develop','sourceBranch':'openai/mac','branchCreated':False,'hostedWrites':0,'tiers':[],'controls':controls,'scope':'Exact path review projections, not independently admitted PRs or merge authority.'}
with tempfile.TemporaryDirectory(prefix='cf-pr42-index-') as d:
 env={**os.environ,'GIT_INDEX_FILE':str(Path(d)/'index')};git('read-tree',base,env=env);previous=git('rev-parse',base+'^{tree}').decode().strip()
 for t in TIERS:
  body=[];index=[]
  for p in groups[t]:
   mode,oid=new.get(p,('0','0'*40));index.append((mode+' '+oid+'\t'+p+'\0').encode());body.append({'path':p,'before':old.get(p),'after':new.get(p)})
  git('update-index','-z','--index-info',env=env,data=b''.join(index));tree=git('write-tree',env=env).decode().strip();name=t+'-paths.json';raw=(json.dumps(body,indent=2)+'\n').encode();(out/name).write_bytes(raw)
  receipt['tiers'].append({'tier':t,'paths':len(body),'previousTree':previous,'tree':tree,'manifest':name,'sha256':hashlib.sha256(raw).hexdigest(),'standaloneAdmission':'NOT_RUN','futureMerge':'normal merge commit; never squash'});previous=tree
 if previous!=git('rev-parse',head+'^{tree}').decode().strip():raise AssertionError('Combined split changes source tree')
receipt['combinedTreeExactlySource']=True
# Concrete forward local-file dependencies, not a speculative complete module graph.
edges=[]
for p in changed:
 if p not in new or not p.endswith(('.ts','.mjs','.js')) or tier(p)=='tools':continue
 text=git('show',head+':'+p).decode(errors='replace')
 for spec in re.findall(r"(?:from\s*|import\s*\(\s*)['\"]([^'\"]+)['\"]",text):
  if not spec.startswith('.'):continue
  stem=os.path.normpath(str(Path(p).parent/spec));candidates=[stem,re.sub(r'\.js$','.ts',stem),str(Path(stem)/'index.ts')];target=next((c for c in candidates if c in new),None)
  if target and target in changed and TIERS.index(tier(target))>TIERS.index(tier(p)):edges.append({'from':p,'to':target,'fromTier':tier(p),'toTier':tier(target),'absentAtBase':target not in old})
receipt['forwardLocalDependencies']=edges
(out/'split.json').write_text(json.dumps(receipt,indent=2)+'\n')
for t in TIERS:
 rows=groups[t];(out/(t+'-review-command.txt')).write_text('git diff '+next(r['previousTree'] for r in receipt['tiers'] if r['tier']==t)+' '+next(r['tree'] for r in receipt['tiers'] if r['tier']==t)+'\n')
print(json.dumps({'source':head,'base':base,'paths':len(changed),'tiers':{t:len(v) for t,v in groups.items()},'forwardDependencies':len(edges),'combinedTreeExactlySource':True}))
