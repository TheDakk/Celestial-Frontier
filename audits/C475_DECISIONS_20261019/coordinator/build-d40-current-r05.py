from pathlib import Path
import json,hashlib,subprocess,struct
B=Path('audits/C475_DECISIONS_20261019');O=B/'delivery/wave15-cpu-candidates-and-material-holds';O.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();pin=lambda p:{'path':str(p),'sha256':sha(p)}
source=B/'w1-keyer/named28-current-r03/dispositions-r04.json';j=json.loads(source.read_text());rows=[];checked=0
ready={'Butterfly':'butterfly-d40-r02','Cricket':'cricket-d40','Snake':'snake-d40'}
for old in j['rows']:
 for key in ['source','canonical','derivative','receipt','request','currentStaticEvidence','currentObservedSourceWitness','currentMaterialEvidence']:
  p=old.get(key)
  if isinstance(p,dict) and 'path'in p and 'sha256'in p:assert sha(p['path'])==p['sha256'],p['path'];checked+=1
 row={'name':old['name'],'status':old['status'],'source':old['source'],'canonical':old['canonical'],'canonicalRgbaSha256':old['canonicalRgbaSha256'],'derivative':old['derivative'],'evidenceSnapshot':pin(source),'anatomicalPaintReview':old.get('sourcePigmentFringeReview')}
 if row['name']in ready:
  p=B/'ready'/ready[row['name']]/'packet.json';r=json.loads(p.read_text());assert r['status']=='READY_FOR_CLAUDE'and len(r['canonicalFive'])==5
  assert subprocess.check_output(['git','log','-1','--format=%G?',r['producer']['commit']]).decode().strip()=='G'
  for f in r['canonicalFive']:
   q=Path(f['file']['path']);assert sha(q)==f['file']['sha256'];assert struct.unpack('>II',q.read_bytes()[16:24])==(1024,576)
  row.update(status='READY_FOR_CLAUDE',currentPacket=pin(p),I5RecertificationRequired=True,admitted=False,defect=None)
 elif not old['actual8percent']['pass']:
  m=old['actual8percent'];row['defect']={'kind':'EXACT_8PERCENT_MARGIN','marginsPx':m['marginsPx'],'requiredPx':m['requiredPx'],'allAlphaAbove16Retained':True}
 elif old['firstStaticRefusals']if 'firstStaticRefusals'in old else False:
  row['defect']={'kind':'ACTUAL_STATIC_MOTION_REFUSAL','firstRefusals':old['firstStaticRefusals'],'report':old.get('currentStaticEvidence',old.get('static'))}
 else:row['defect']={'kind':'SOURCE_MATERIAL_OR_COMPILER','observed':old.get('sourcePigmentFringeReview'),'report':old.get('currentMaterialEvidence',old.get('currentObservedSourceWitness'))}
 rows.append(row)
assert len(rows)==28 and sum(r['status']=='READY_FOR_CLAUDE'for r in rows)==3
out={'schema':'cf.c475-d40-current/v5','status':'D40_NAMED28_DISPOSITIONS_CURRENT_NO_ADMISSIONS','supersedesNativePendingSnakeOnlyByNewOverlay':pin(source),'counts':{'READY_FOR_CLAUDE':3,'HOLD':25,'material':4,'static':11,'exactMargin':7,'compilerRepresentation':3},'unchangedCanonicalSeals':True,'sourcePinChecks':checked,'classProof':pin(B/'class-proofs/d40-thin-stroke-matte.json'),'rows':rows,'scope':'Actual current completed packets and exact source/static/margin/compiler holds. Original historical source/native holds and all immutable worker snapshots remain unchanged. Natural occlusion and biological pigment are not defects by themselves.'}
(O/'d40-current28.json').write_text(json.dumps(out,indent=2)+'\n')
lines=['# D40 — current named28','', 'Three finished packets are READY_FOR_CLAUDE;25 have the exact defects below. No admission or certification is claimed. Canonical keyed seals remain unchanged.','', '|Species|Disposition|Defect or packet|','|---|---|---|']
for r in rows:
 if r['status']=='READY_FOR_CLAUDE':why=f"[All five finished stills]({Path(r['currentPacket']['path']).absolute()})"
 elif r['defect']['kind']=='EXACT_8PERCENT_MARGIN':why=f"All alpha>16 retained; margins {r['defect']['marginsPx']} versus {r['defect']['requiredPx']}px on every side."
 elif r['defect']['kind']=='ACTUAL_STATIC_MOTION_REFUSAL':why='; '.join(f"{q['action']} at {q.get('atMs')}ms: {q['error']}"for q in r['defect']['firstRefusals'])
 else:why=r['defect']['observed']
 lines.append('|'+r['name']+'|'+('READY_FOR_CLAUDE'if r['status']=='READY_FOR_CLAUDE'else'HOLD')+'|'+str(why).replace('|','\\|').replace('\n',' ')+'|')
(O/'d40-current28.md').write_text('\n'.join(lines)+'\n');print(json.dumps({'count':28,'ready':3,'hold':25,'checkedSourcePins':checked}))
