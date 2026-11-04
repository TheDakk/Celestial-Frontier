from pathlib import Path
import json,hashlib,shutil
root=Path('audits/G1_AUTO_AUTHOR_20260926/auto-sweep3')
classes={'bird-back-crest':['c213originals-21-auk','c213originals-28-kookaburra','c213originals-29-osprey'],'primate-victory':['c198creaturesupplyb-07-howler-monkey','c198creaturesupplyb-11-langur'],'deep-faint':['c202creaturesupply-02-wild-boar','c203creaturesupply-07-wild-pig','c203creaturesupply-10-cow','g2c95-17-nilgai'],'thin-limb':['c203creaturesupply-13-gerenuk'],'head-seam':['c213originals-09-kinkajou'],'claw-island':['c202creaturesupply-12-wolverine'],'static-fold':['g2c72-12-egret'],'native-fail':['g2c95-23-springtail','c213originals-14-red-fox'],'insect-victory':['g2c136targetededits-21-bee']}
prior={x['id']:x['fit'] for x in json.loads(Path('audits/C213_PROGRAM_20261004/phase4-delivery.json').read_text())}
rows=[]
for kind,ids in classes.items():
 for id in ids:
  d=root/id;s=json.loads((d/'score.json').read_text());wins=[c for c in s.get('candidates',[]) if c.get('static')=='PASS_STATIC'];w=wins[0] if s.get('fallbackFrom') else None
  candidate=d/('fallback-'+str(w['rank'])) if w and w['rank']>0 else d
  fit=next((candidate/x/'fit' for x in ['merge-joint','tail-labels'] if (candidate/x/'fit/binding.json').exists()),candidate/'fit')
  if kind in ['deep-faint','insect-victory'] or id=='g2c95-23-springtail':fit=Path(prior.get(id,str(fit)))
  sibling=Path.home()/'Projects/celestial-frontier-anthropic-mac'
  if not (fit/'binding.json').exists():
   source=sibling/fit;assert (source/'binding.json').is_file(),source
   fit.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(source,fit)
  r=json.loads((fit/'record.json').read_text());master=Path(r['source'])
  if not master.exists():
   source=sibling/master;assert source.is_file(),source
   master.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,master)
  assert master.is_file(),master
  rows.append({'id':id,'class':kind,'sourceFit':str(fit),'sourceBindingSha256':hashlib.sha256((fit/'binding.json').read_bytes()).hexdigest(),'master':str(master),'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'status':'PREPARED_NOT_RUN'})
Path('audits/C215_PROGRAM_20261009/phase5/cases.json').write_text(json.dumps(rows,indent=2)+'\n')
print(len(rows),'independent successor cases prepared')
