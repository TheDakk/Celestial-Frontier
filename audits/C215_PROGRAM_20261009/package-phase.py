from pathlib import Path
import json,sys,hashlib
phase=int(sys.argv[1]);tag='c215p'+str(phase);previous='sweep3' if phase==1 else 'c215p'+str(phase-1)
root=Path('audits/G1_AUTO_AUTHOR_20260926');base=Path('audits/C215_PROGRAM_20261009')/('phase'+str(phase));base.mkdir(exist_ok=True)
new=json.load(open(root/('native-'+tag)/'summary.json'));old=json.load(open(root/('native-'+previous)/'summary.json'))
assert new['runnerExit']==0 and new['scored']==500 and old['scored']==500
pilot=json.load(open(root/'pilots/sweep3.json'));byid={p['id']:p for p in pilot};name=lambda i:json.load(open(Path(byid[i]['packet'])/'subject-source.json'))['name']
a=set(old['admitPassStatic']);b=set(new['admitPassStatic']);gained=sorted(b-a);lost=sorted(a-b)
rows=[json.load(open(root/('auto-'+tag)/p['id']/'score.json')) for p in json.load(open(root/'pilots'/f'{tag}-eligible.json'))];assert len(rows)==500 and all(r['id'] for r in rows)
result={'phase':phase,'scored':500,'staticBefore':len(a),'staticAfter':len(b),'gainedPackets':gained,'lostPackets':lost,'gainedSpecies':sorted(set(map(name,b))-set(map(name,a))),'lostSpecies':sorted(set(map(name,a))-set(map(name,b))),'changedPacketSpecies':sorted(set(map(name,gained+lost))),'scope':'Fixed-cohort static diagnostic, not native/visual admission or certification','scores':rows}
(base/'yield.json').write_text((json.dumps(result,indent=2)+'\n').replace(str(Path.home()),'~'))
paths=[];deliver=[];normalizations=[];sha=lambda raw:hashlib.sha256(raw).hexdigest()
for i in gained:
 d=root/('auto-'+tag)/i
 for p in d.rglob('*'):
  if p.is_symlink():assert not Path(p.readlink()).is_absolute(),p
  if not p.is_file():continue
  raw=p.read_bytes()
  try:text=raw.decode('utf8')
  except UnicodeDecodeError:continue
  normalized=text.replace(str(Path.home()),'~').encode()
  if normalized!=raw:tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_bytes(normalized);tmp.replace(p);normalizations.append({'path':str(p),'beforeSha256':sha(raw),'afterSha256':sha(normalized),'change':'home prefix to ~/ only; diagnostic metadata transport'})
  assert b'/Users/' not in normalized and b'/home/' not in normalized,p
 paths.append(str(d));r=json.load(open(d/'score.json'));win=next((c for c in r.get('candidates',[]) if c.get('static')=='PASS_STATIC'),None) if r.get('fallbackFrom') else None
 candidate=d/('fallback-'+str(win['rank'])) if win and win['rank']>0 else d
 fit=next((candidate/x/'fit' for x in ['merge-joint','tail-labels'] if (candidate/x/'fit/binding.json').exists()),candidate/'fit');assert (fit/'binding.json').exists()
 record=json.load(open(fit/'record.json'));master=Path(record['source']);assert master.exists();assert str(master).startswith(str(d)),master
 deliver.append({'id':i,'name':name(i),'fit':str(fit),'master':str(master),'masterSha256':sha(master.read_bytes()),'status':'PASS_STATIC_PENDING_CLAUDE_NATIVE_AND_VISUAL_REVIEW'})
(base/'delivery.json').write_text(json.dumps(deliver,indent=2)+'\n');(base/'stage-paths.json').write_text(json.dumps(paths,indent=2)+'\n');(base/'path-normalizations.json').write_text(json.dumps(normalizations,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='scores'},indent=2))
