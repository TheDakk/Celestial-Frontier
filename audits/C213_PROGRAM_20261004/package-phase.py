from pathlib import Path
import json,hashlib,shutil,sys
n=int(sys.argv[1]);b=Path('audits/C213_PROGRAM_20261004');a=Path('audits/G1_AUTO_AUTHOR_20260926/auto-c213p'+str(n));summary=json.load(open(b/('phase'+str(n)+'-yield.json')));out=b/('phase'+str(n)+'-deliveries');out.mkdir(exist_ok=True);delivery=[]
for id in summary['gained']:
 d=a/id;r=json.load(open(d/'score.json'));win=next((c for c in r.get('candidates',[]) if c.get('static')=='PASS_STATIC'),None) if r.get('fallbackFrom') else None
 if win:d=d/('fallback-'+str(win['rank']))
 fit=next((d/x/'fit' for x in ['merge-joint','tail-labels'] if (d/x/'fit/binding.json').exists()),d/'fit');dest=out/id;shutil.copytree(fit,dest/'fit');record=json.load(open(fit/'record.json'));master=Path(record['source']);assert hashlib.sha256(master.read_bytes()).hexdigest()==record['geometry']['cutoutAssetHash'];delivery.append({'id':id,'name':record['identity']['earthName'],'fit':str(dest/'fit'),'master':str(master),'masterSha256':record['geometry']['cutoutAssetHash'],'status':'PASS_STATIC_NOT_NATIVE_OR_ADMITTED'})
(out/'delivery.json').write_text(json.dumps(delivery,indent=2)+'\n')
