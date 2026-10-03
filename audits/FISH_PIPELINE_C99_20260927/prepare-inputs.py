from pathlib import Path
import json,hashlib,shutil,subprocess
base=Path(__file__).resolve().parent;root=base.parents[1];other=Path('/Users/dakk/Projects/celestial-frontier-anthropic-mac');sha=lambda b:hashlib.sha256(b).hexdigest();rows=[];inventory=[];masters=[];recipes=[]
for name in ['compile.mjs','fish-split.mjs','run-candidates.py','run-native.py','restore-masters.mjs','selection-controls.mjs','selector-mutations.mjs']:
 src=root/'audits/FISH_PIPELINE_C88_20260927'/name;dst=base/name;assert not dst.exists();shutil.copyfile(src,dst);recipes.append({'source':str(src.relative_to(root)),'copy':str(dst.relative_to(root)),'sha256':sha(src.read_bytes()),'unchanged':True})
for name in ['run-final-battery.py','push-preflight.py']:shutil.copyfile(root/'audits/G2_C98_20260927'/name,base/name)
for tag,ident,batch in [('g2c90','08-gar','G2_C90_20260927'),('g2c90','12-killifish','G2_C90_20260927'),('g2c92','02-parrotfish','G2_C92_20260927'),('g2c95','02-rabbitfish','G2_C95_20260927'),('g2c95','03-sea-bass','G2_C95_20260927')]:
 parent=other/'audits/G1_AUTO_AUTHOR_20260926'/('auto-'+tag)/ident;src=parent/'fit';native=root/'audits/G1_AUTO_AUTHOR_20260926'/('native-'+tag)/ident/'report.json';report=json.loads(native.read_text());assert report['status']=='DIAGNOSTIC_PASS';score=json.loads((parent/'score.json').read_text());assert score['static']=='PASS_STATIC' and score['semanticPresence'].startswith('RESOLVED:')
 for n in ['record.json','binding.json']:
  ev=[x for x in report['sources'] if x['path']==str(src/n)];assert len(ev)==1 and sha((src/n).read_bytes())==ev[0]['sha256']
 dst=base/'inputs'/ident;assert not dst.exists();shutil.copytree(src,dst)
 for f in sorted(src.rglob('*')):
  if f.is_file():
   q=dst/f.relative_to(src);assert q.read_bytes()==f.read_bytes();inventory.append({'source':str(f),'copy':str(q.relative_to(root)),'sha256':sha(f.read_bytes()),'bytes':f.stat().st_size})
 record=json.loads((src/'record.json').read_text());decl=json.loads((src/'declaration.json').read_text());assert decl['schema']=='cf.authored-part-masks/v1';master=root/'audits'/batch/ident/'master.png';assert sha(master.read_bytes())==record['geometry']['cutoutAssetHash'];original_source=root/record['source']
 if original_source.exists():assert original_source.read_bytes()==master.read_bytes()
 else:original_source.parent.mkdir(parents=True,exist_ok=True);original_source.write_bytes(master.read_bytes())
 rows.append({'id':ident,'tag':tag,'fit':str(src),'schema':decl['schema'],'remainder':decl['remainderPart'],'remainderJoint':next(p['joint'] for p in decl['parts'] if p['id']==decl['remainderPart']),'masterSource':record['source'],'masterSha256':sha(master.read_bytes()),'localFit':str(dst.relative_to(root)),'previousNative':str(native.relative_to(root)),'previousNativeSha256':sha(native.read_bytes()),'semanticPresence':score['semanticPresence']})
 masters.append({'canonicalMaster':str(master.relative_to(root)),'recordSource':record['source'],'masterSha256':sha(master.read_bytes())})
for name,body in [('inputs.json',rows),('input-inventory.json',inventory),('master-inputs.json',masters),('recipe-parity.json',recipes)]:
 with (base/name).open('x') as f:f.write(json.dumps(body,indent=2)+'\n')
print('Five exact native-winning fits and masters retained; seven recipe files unchanged')
