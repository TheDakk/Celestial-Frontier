from pathlib import Path
import json,hashlib,subprocess
b=Path('audits/C215_PROGRAM_20261009/phase5');rows=json.load(open(b/'successors/summary.json'));replacements={r['id']:r for r in json.load(open(b/'successors02/summary.json'))};rows=[replacements.get(r['id'],r) for r in rows];reviews={x['id']:x for f in ['visual-review01.json','visual-review02.json'] for x in json.load(open(b/f))};stage=set();delivery=[]
for r in rows:
 fit=Path(r.get('fit',r['sourceFit']));record=json.load(open(fit/'record.json'));master=Path(record['source']);assert master.is_file(),master
 # Preserve exact sources used by the independently replayable successor recipe.
 stage.add(r['sourceFit']);stage.add(str(master.parent));
 if r.get('nativeDir'):
  n=Path(r['nativeDir']);(n/'.gitignore').write_text('*.webm\n*.png\n!turn0-hit-approach-50.png\n!turn3-hit-idle-50.png\n!turn3-hit-idle-90.png\n')
 review=reviews.get(r['id'],{'status':r['status'],'observation':r.get('reason',r.get('error','Static/native refusal retained'))})
 delivery.append({**r,'master':str(master),'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'visual':review,'admission':'CLAUDE_PENDING' if review['status']=='REVIEW_CANDIDATE' else 'HOLD'})
(b/'successor-delivery.json').write_text(json.dumps(delivery,indent=2)+'\n');(b/'successor-stage-paths.json').write_text(json.dumps(sorted(stage),indent=2)+'\n')
print({s:sum(r['admission']==s for r in delivery) for s in ['CLAUDE_PENDING','HOLD']})
