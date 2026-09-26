#!/usr/bin/env python3
"""Snapshot selected local review evidence; never mutate source media or Git state.
Usage: python3 audits/CROSS_PACKAGE_PROGRESS_20260914/package-review.py NEW_DIRECTORY
Archives include a source patch/snapshots, not a runnable full repository or all old media.
"""
from pathlib import Path
import sys,subprocess,json,hashlib,zipfile,io
ROOT=Path(__file__).resolve().parents[2]
BASE='b50668b0'
LIMIT=28_000_000
OUT=Path(sys.argv[1]).resolve()
if OUT.exists():raise SystemExit('Refuse existing output directory')
OUT.mkdir(parents=True)
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def digest(b):return hashlib.sha256(b).hexdigest()
def read(path):
 p=ROOT/path
 if not p.resolve().is_relative_to(ROOT) or not p.is_file():raise ValueError(path)
 return p.read_bytes()
selected={}
def add(path):selected[str(path)]=read(path)
def glob(pattern):
 for p in sorted(ROOT.glob(pattern)):
  if p.is_file() and p.name!='.DS_Store':add(p.relative_to(ROOT))
roots=['ROADMAP.md','PARALLEL_GIT_PROTOCOL.md','CREATURE_ANIMATION.md','AUDIO.md','ART_DIRECTION.md','LOCAL_AI_GENERATION.md','UI_TOOLCHAIN.md','celestial-frontier-codebase-reference.md','ART_KIT.md','MOTION_KIT.md','SOUND_KIT.md']
for p in roots:add(p)
for pattern in ['audits/CROSS_PACKAGE_PROGRESS_20260914/*.md','audits/CROSS_PACKAGE_PROGRESS_20260914/checks*/*','audits/CROSS_PACKAGE_PROGRESS_20260914/arena-*.json','audits/CROSS_PACKAGE_PROGRESS_20260914/checks.json','audits/CROSS_PACKAGE_PROGRESS_20260914/package-review.py','audits/LONG_SESSION_20260913/*.md','audits/C_LANE_BATCH_REVIEW_20260913/*.*','audits/C_LANE_REPAIRS_20260914/*.md','audits/C_LANE_REPAIRS_20260914/*.json','audits/C_SYSTEMS_CONTINUATION_20260914/*.md','audits/C_SYSTEMS_CONTINUATION_20260914/*.json','audits/C2_DEFORMING_SEAMS_20260914/*.md','audits/C2_DEFORMING_SEAMS_20260914/candidate-07/*.json','audits/C2_DEFORMING_SEAMS_20260914/native-hinges-03/report.json','audits/C2_DEFORMING_SEAMS_20260914/native-hinges-03/*-full-*.png','audits/C2_DEFORMING_SEAMS_20260914/native-hinges-03/*ear-far*.png','audits/C2_DEFORMING_SEAMS_20260914/candidate-02/*-ink/atlas/*.*']:
 glob(pattern)
for p in ['audits/CIVET_2D_PROOF_20260912/civet.landmarks.json','audits/C2_BOUNDED_REPAIR_20260913/candidate-01/fox.landmarks.json','audits/C2_PARTS_ATLAS_20260913/native-painter-parts-03/record.json','audits/C2_PARTS_ATLAS_20260913/native-painter-parts-03/master.png','audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png','audits/ART_KIT_ENGINE_FIRST_20260912/masters/family-mammal-quadruped.png','audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png','audits/ARENA_V1_ACCEPTANCE_20260912/arena-template-v1.png']:
 add(p)
# Include exact arena source/card/runtime dependencies declared by the reviewed manifest.
m=json.loads(read('audits/CROSS_PACKAGE_PROGRESS_20260914/arena-manifest.json'))
add(m['recipe']['path']);r=json.loads(read(m['recipe']['path']));add(r['systemCardSource'])
for l in m['layers']:
 for field in ['source','runtime']:add(l[field]['path'])
# Include changed source snapshots and their patch; never all historical binary changes.
changed=git('diff','--name-only',BASE,'--').decode().splitlines()
code=[p for p in changed if p.startswith(('port/v2/','tools/')) and Path(p).suffix in ['.mjs','.ts','.js','.json','.md']]
for p in code:
 if (ROOT/p).is_file():add(p)
patch=git('diff','--no-ext-diff','--no-textconv',BASE,'--',*code)
selected['review/source.patch']=patch
# Index old evidence without silently suggesting all of it is in the ZIPs.
indexed=[]
for dirname in ['C_LANE_BATCH_REVIEW_20260913','C_LANE_REPAIRS_20260914','C_SYSTEMS_CONTINUATION_20260914','C2_DEFORMING_SEAMS_20260914']:
 for p in sorted((ROOT/'audits'/dirname).rglob('*')):
  if p.is_file() and p.name!='.DS_Store':
   name=str(p.relative_to(ROOT));b=p.read_bytes();indexed.append({'path':name,'bytes':len(b),'sha256':digest(b),'included':name in selected})
selected['review/evidence-index.json']=(json.dumps(indexed,indent=2)+'\n').encode()
head=git('rev-parse','HEAD').decode().strip()
snapshot={'schema':'cf.review-source-snapshot/v1','base':BASE,'head':head,'headIsSigned':b'gpgsig' in git('cat-file','commit',head),'sourcePatchSha256':digest(patch),'includesUncommittedChanges':bool(git('diff','HEAD','--',*code)),'nativeEvidenceHead':'61512b3a92c25582167e6f7b5dbcf11f5f80eec9','scope':'Review snapshot only; no kit, media, Git or runtime mutation. Not every historical asset is bundled.'}
selected['review/source-snapshot.json']=(json.dumps(snapshot,indent=2)+'\n').encode()
selected['START_HERE.md']=b'Read audits/CROSS_PACKAGE_PROGRESS_20260914/REVIEW_PROMPT.md and README.md. Combine these ZIP parts in one review. They preserve repository paths but are review evidence, not an install/update packet. Source snapshot records signed head and any uncommitted patch. Historical evidence omitted from the ZIPs is explicitly indexed.\n'
# Place instructions/text first; media next, each entry exactly once. Deterministic ZIP metadata.
items=sorted(selected.items(),key=lambda x:(0 if x[0]=='START_HERE.md' else 2 if Path(x[0]).suffix.lower() in ['.png','.mp4','.webm'] else 1,x[0]))
def archive(rows):
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for name,b in rows:
   zi=zipfile.ZipInfo(name,(1980,1,1,0,0,0));zi.compress_type=zipfile.ZIP_DEFLATED;zi.external_attr=0o100644<<16;z.writestr(zi,b,compresslevel=6)
 return out.getvalue()
# Exact per-entry compressed costs, plus sufficient central-directory/end-record allowance.
parts=[];rows=[];cost=22
for name,b in items:
 n=len(archive([(name,b)]))-22
 if n+22>LIMIT:raise ValueError('Single entry exceeds archive budget: '+name)
 if rows and cost+n>LIMIT:parts.append(rows);rows=[];cost=22
 rows.append((name,b));cost+=n
if rows:parts.append(rows)
archives=[]
for i,rows in enumerate(parts,1):
 b=archive(rows);assert len(b)<LIMIT
 name=f'celestial-cross-package-review-20260914-part-{i:02d}.zip';p=OUT/name;p.write_bytes(b)
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None and z.namelist()==[n for n,_ in rows]
  for n,data in rows:assert digest(z.read(n))==digest(data)
 archives.append({'file':name,'bytes':len(b),'sha256':digest(b),'entries':[{'path':n,'bytes':len(d),'sha256':digest(d)} for n,d in rows]})
receipt={'schema':'cf.review-bundle/v1','source':snapshot,'limitBytes':30_000_000,'targetBytes':LIMIT,'verifiedCrcAndEveryEntrySha256':True,'archives':archives}
(OUT/'bundle-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'source':snapshot,'output':str(OUT),'archives':[{k:a[k] for k in ['file','bytes','sha256']} for a in archives]},indent=2))
