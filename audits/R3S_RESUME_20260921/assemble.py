"""Reconcile retained evidence only. No solver, intake, native or battery execution."""
from pathlib import Path
from collections import Counter
import hashlib, json, subprocess, tempfile, os

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
OLD = ROOT / 'audits/ANATOMY_SINGLE_RUN_20260919'
def read(p): return json.loads((ROOT / p).read_text())
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name, obj): (OUT / name).write_text(json.dumps(obj, indent=2) + '\n')
def git(*args): return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()
head = git('rev-parse', 'HEAD')
assert git('rev-parse', '--show-toplevel') == str(ROOT)
assert git('branch', '--show-current') == 'openai/mac'

# Every historical stage is already an ancestor. Verify actual signatures anew;
# this is receipt verification, not a repetition of the accepted test/capture run.
stages = [
 ('R3-S BEFORE', '6c511261', 'R3-S/before/ledger.json'),
 ('R3-S planted limits', '4b969894', 'R3-S/README.md'),
 ('R3-S acceptance', 'a03b18f5', 'R3-S/static-01/static.json'),
 ('R2d', '7c62a15e', 'R2d/README.md'),
 ('R3 interfaces', '2865b017', 'R3/README.md'),
 ('R4', '7da95a7a', 'R4/README.md'),
 ('native full rows', '6c6ead8c', 'native/README.md'),
 ('R9 producer', '0cae378e', 'R9/README.md'),
 ('R9 identity films', '36489e9a', 'R9/sheet-receipt.json'),
 ('R5-R7', 'c1a985b7', 'R5-R7/README.md'),
 ('R5-R7 root control', 'e750bf00', 'R5-R7/root-proof-02/report.json'),
 ('R8 D1', '7572a5cb', 'R8/README.md'),
 ('roster dispositions', 'be0e551f', 'roster/README.md'),
 ('PR42 projections', 'a6afec2e', 'PR42/README.md'),
 ('original final packet', 'a94535aa', 'README.md')]
key = git('config', 'user.signingkey').removeprefix('key::')
with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
 f.write('configured-signer ' + key + '\n'); signer = f.name
signatures = []
try:
 for label, short, evidence in stages + [('later shared controls','63b13bff',None), ('continuity guard','ea998874',None), ('continuity native','d17f512d',None), ('desktop tier','c93ee2e8',None), ('folded declaration','73398486',None)]:
  commit = git('rev-parse', short)
  subprocess.run(['git','merge-base','--is-ancestor',commit,head], cwd=ROOT, check=True)
  v = subprocess.run(['git','-c','gpg.ssh.allowedSignersFile='+signer,'-c','gpg.ssh.program=/usr/bin/ssh-keygen','verify-commit',commit], cwd=ROOT, capture_output=True, text=True)
  assert v.returncode == 0, (commit, v.stderr)
  signatures.append({'stage':label,'commit':commit,'signature':v.stderr.strip(),'evidence':str((OLD/evidence).relative_to(ROOT)) if evidence else None})
finally: os.unlink(signer)
write('signed-stages.json', signatures)

source_checks = []
for manifest in ['audits/VISION_P1_CONSOLIDATED_20260920/shared-controls-result.sources.json','audits/VISION_P1_DESKTOP_DELIVERY_20260920/frozen-inputs.json']:
 value = read(manifest); rows = value if isinstance(value,list) else value['files']; changes=[]
 for row in rows:
  p=ROOT/row['path']; actual=sha(p)
  if actual!=row['sha256']: changes.append({'path':str(p.relative_to(ROOT)),'before':row['sha256'],'current':actual})
 permitted = {'port/v2/tools/creature-animation/'+n for n in ['anatomy-inventory.mjs','anatomy-inventory.d.mts','repeated-anatomy.mjs']}
 assert all(r['path'] in permitted for r in changes), changes
 source_checks.append({'manifest':manifest,'files':len(rows),'changes':changes,'diagnosis':'Only signed73398486 optional folded-presence handling; no solver, skin, accepted record, binding or image change.'})
write('source-reconciliation.json', source_checks)

before=read('audits/ANATOMY_SINGLE_RUN_20260919/R3-S/before/ledger.json')
after=read('audits/ANATOMY_SINGLE_RUN_20260919/R3-S/after/ledger.json')
strict=read('audits/ANATOMY_SINGLE_RUN_20260919/R3-S/static-01/static.json')
latest=read('audits/VISION_P1_CONSOLIDATED_20260920/shared-controls/static.json')
assert not after['events']
summary=[]
for s in latest['subjects']:
 assert s['status']=='PASS' and s['exactRestGeometry'] and s['maxPaintDriftPx']<=.25
 if s['subject']!='civet': assert s['r2cRowsBitIdentical']
 prior=next(r for r in strict['subjects'] if r['subject']==s['subject'])
 assert s['rows']==prior['rows'] and s['maxPaintDriftPx']==prior['maxPaintDriftPx']
 summary.append({k:s[k] for k in ['subject','status','maxPaintDriftPx','exactRestGeometry','maxCovariancePx'] } | {'r2cRowsBitIdentical':s.get('r2cRowsBitIdentical'),'rows':len(s['rows']),'samples':sum(r['samples'] for r in s['rows'])+s['presentation']['samples']})
write('S2-ledger.json', {'schema':'cf.s2-resume-reconciliation/v1','sourceHead':head,'status':'NO_NEW_S2_IN_RETAINED_EVIDENCE','newSolverChanges':False,'newSweepExecuted':False,'beforeProducer':before['producer'],'beforeEvents':dict(Counter(e['kind'] for e in before['events'])),'afterProducer':after['producer'],'afterEvents':dict(Counter(e['kind'] for e in after['events'])),'latestSharedControlProducer':latest['baseHead'],'subjects':summary,'sampleCount':sum(r['samples'] for r in summary),'scope':'Retained signed stage results; current provenance differs only in independently checked folded presence handling. Not a newly executed battery. Historical R2c stops remain retained.','controls':'Original x3 crouch is retained as insensitive; Nick-authorized x15 rejects. All-four stance, diffused and unpinned controls reject. No reverted clip keys, pin repair or gait-phase changes.'})

media=[]
for r in read('audits/ANATOMY_SINGLE_RUN_20260919/media-index.json'):
 p=OLD/r['path'];assert p.is_file() and p.stat().st_size==r['bytes'] and sha(p)==r['sha256'],str(p)
 media.append({**r,'path':str(p.relative_to(ROOT)),'group':'original section8'})
seen={r['path'] for r in media}
for folder in ['VISION_P1_CONSOLIDATED_20260920','VISION_P1_DESKTOP_DELIVERY_20260920','VISION_P1_COCONUT_20260920','VISION_P1_FOUR_CRABS_20260920']:
 for p in sorted((ROOT/'audits'/folder).rglob('*')):
  if p.is_file() and (p.suffix=='.webm' or p.suffix=='.png' and ('sheet' in p.name or 'overview' in p.name)):
   rel=str(p.relative_to(ROOT))
   if rel not in seen:media.append({'path':rel,'sha256':sha(p),'bytes':p.stat().st_size,'group':folder});seen.add(rel)
write('media-index.json',media)

leaves=read('audits/ANATOMY_SINGLE_RUN_20260919/leaf-ledger.json')
for r in leaves:r['evidence']='audits/ANATOMY_SINGLE_RUN_20260919/'+r['evidence']
for r in leaves:
 if r['id']=='native-civet-2':r['laterDisposition']='Historical single-stride non-gait diagnostic; later measured split continuity guard retained in VISION_P1_CONSOLIDATED_20260920/ROOT_CONTINUITY.md. Original report unchanged.'
delivery=read('audits/VISION_P1_DESKTOP_DELIVERY_20260920/results.json')
for r in delivery:
 if not r['admission']['cpuPass']:leaves.append({'id':'painted-desktop-'+r['id'],'subject':r['id'],'status':'open','diagnosis':str(r['admission']['valueMs'])+'ms full-film rig p95 exceeds approved3.5ms desktop tier; geometry/contact/rest/continuity pass, no retry.','evidence':'audits/VISION_P1_DESKTOP_DELIVERY_20260920/results.json'})
write('leaf-ledger.json',leaves)
roster=read('audits/ANATOMY_SINGLE_RUN_20260919/roster/native-01/report.json')
write('roster-prep.json',{'status':'PREP_ONLY_IC3_FROZEN','historicalCounts':roster['counts'],'historicalEvidence':'audits/ANATOMY_SINGLE_RUN_20260919/roster/README.md','newIntakeExecuted':False,'order':'Retain clawed-crustacean → terrestrial-crab → small-crustacean → other source-family order; compiler IC-4 must pass before new-species intake.','presenceInputs':[str(p.relative_to(ROOT)) for p in sorted((ROOT/'audits/VISION_P1_FOUR_CRABS_20260920').rglob('presence.json'))],'sealedRecordsUnchanged':True})
write('signing-refusal.json',{'stage':'pending canonical native evidence','status':'SIGNING_REFUSED','error':'1Password: agent returned an error; fatal: failed to write commit object','head':head,'newCommitCreated':False,'retryCondition':'Nick confirms signing authentication ready; no repeated capture or battery.'})
write('summary.json',{'status':'RECONCILED_EXISTING_COMPLETED_RUN','sourceHead':head,'verifiedSignedStages':len(signatures),'verifiedOriginalMedia':833,'indexedMedia':len(media),'films':sum(r['path'].endswith('.webm') for r in media),'newSourceChanges':False,'newIntakes':0,'newCaptures':0,'s2':'No new S2 in retained results; see S2-ledger.json','signing':'Pending native-evidence and reconciliation commits; authentication requested.'})
print(json.dumps({'signedStages':len(signatures),'media':len(media),'films':sum(r['path'].endswith('.webm') for r in media),'beforeClasses':dict(Counter(e['kind'] for e in before['events'])),'afterEvents':len(after['events']),'strictSamples':sum(r['samples'] for r in summary)}))
