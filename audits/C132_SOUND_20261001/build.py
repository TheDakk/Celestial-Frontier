"""Prepare recorded-file candidates for the closed 49-cue battle vocabulary; no synth or runtime admission."""
from pathlib import Path
import json, hashlib, subprocess, struct, math
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent/'candidate-02'
OUT.mkdir(exist_ok=True)
AUDIO=ROOT/'audio-production'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args): return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout
def read(p): return json.loads(p.read_text())
media={r['path']:r for r in read(AUDIO/'manifests/acquisition.json')['media']}
reports={}
for f in sorted((AUDIO/'reports').glob('*.json')):
    for row in read(f).get('outputs',[]):
        if isinstance(row,dict) and 'id' in row and 'layers' in row: reports[row['id']]=row
mapping={
 'turn-ready':'battle.initiative.1','cursor':'ui.select.1','confirm':'ui.confirm.1','cancel':'ui.back.1',
 'approach-start':'battle.first-strike.1','hitstop-thump':'battle.damage.1','flash-sting':'battle.critical.1',
 'shake-rumble':'battle.guardian-entrance.1','damage-tick':'ui.tick.1','miss-whiff':'battle.dodge.2',
 'dodge-swish':'battle.dodge.1','faint-fall':'battle.guardian-defeat.1',
 'victory-sting':'battle.guardian-victory.1','defeat-sting':'battle.guardian-defeat.2',
 'battle-start':'battle.guardian-entrance.2','battle-end':'ui.close.1'}
themes=['fire','frost','storm','tide','stone','venom','void','sand','chem','psionic','wild']
plans=[]
for theme in themes:
 for phase,old,duration in [('launch','cast',.30),('travel','sustain',.42),('impact','impact',.54)]:
    plans.append({'id':f'ability:{theme}:{phase}','sourceId':f'ability.{theme}.{old}.1','duration':duration,'phase':phase})
for cue,source in mapping.items():
 duration=.18 if cue in ['cursor','confirm','cancel','damage-tick','turn-ready'] else .55
 if cue in ['victory-sting','defeat-sting','battle-start','battle-end']: duration=.80
 plans.append({'id':'battle:'+cue,'sourceId':source,'duration':duration,'phase':'battle'})
assert len(plans)==49
(OUT/'wav').mkdir(exist_ok=True); (OUT/'opus').mkdir(exist_ok=True)
results=[]
for plan in plans:
 row=reports[plan['sourceId']]; layer=row['layers'][0]; m=media[layer['path']]
 assert m['licenseId'] in ['CC0-1.0','CC-BY-4.0','CC-BY-3.0','Public-Domain','public-domain','Public-domain-NPS-statement'],m['licenseId']
 source=AUDIO/layer['path']; assert sha(source)==layer['sha256']==m['sha256']
 slug=plan['id'].replace(':','-'); wav=OUT/'wav'/f'{slug}.wav'; opus=OUT/'opus'/f'{slug}.opus'
 assert not wav.exists() and not opus.exists(),'No overwrite of candidates'
 duration=plan['duration']; args=['ffmpeg','-nostdin','-v','error','-i',str(source)]
 filt=f'aresample=48000,aformat=channel_layouts=mono,apad,atrim=duration={duration},afade=t=in:d=0.004,afade=t=out:st={max(.005,duration-.065)}:d=0.065,alimiter=limit=0.65:level=false,volume=0.7'
 args+=['-af',filt,'-c:a','pcm_s24le',str(wav)]; run(args)
 run(['ffmpeg','-nostdin','-v','error','-i',str(wav),'-c:a','libopus','-b:a','96k',str(opus)])
 raw=run(['ffmpeg','-nostdin','-v','error','-i',str(wav),'-f','f32le','-acodec','pcm_f32le','-'])
 vals=struct.unpack('<'+'f'*(len(raw)//4),raw); assert vals and all(map(math.isfinite,vals))
 peak=max(abs(x) for x in vals); rms=math.sqrt(sum(x*x for x in vals)/len(vals)); assert 1e-6<rms and peak<.9
 actual=len(vals)/48000; assert abs(actual-duration)<.003
 results.append({**plan,'sourceKind':m.get('sourceKind'),'source':layer['path'],'sourceSha256':sha(source),
   'creator':m.get('creator'),'license':m['licenseId'],'sourcePage':m.get('sourcePage'),
   'licenseEvidence':m.get('licenseEvidence'),'sourceMasterCandidate':row['id'],
   'treatment':filt,'wav':str(wav.relative_to(ROOT)),'wavSha256':sha(wav),
   'opus':str(opus.relative_to(ROOT)),'opusSha256':sha(opus),'sampleRate':48000,'channels':1,
   'durationSeconds':actual,'peak':peak,'rms':rms,'listeningAccepted':False})
 print('prepared',plan['id'],flush=True)
manifest={'schema':'cf.c132-recorded-cue-candidates/v1','status':'TECHNICAL_PASS','cueCount':len(results),
 'scope':'49 closed-vocabulary recorded-file candidates, sourced from retained licensed designed sound recordings. No runtime oscillators or noise synthesis. Not newly captured biological recordings; no listening acceptance or gameplay admission.',
 'layeredImpactStatus':'Single recorded impact layer per theme; independent transient + mass + material stems remain open.',
 'sources':[{'path':'audio-production/manifests/acquisition.json','sha256':sha(AUDIO/'manifests/acquisition.json')}, {'path':'SOUND_KIT.md','sha256':sha(ROOT/'SOUND_KIT.md')}], 'cues':results}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'CREDITS.md').write_text('# C132 recorded cue candidates — credits\n\n'+''.join(f"- `{r['id']}` — {r['creator']}; {r['license']}; {r['sourcePage']}. Trim, mono resample, fades and bounded gain.\n" for r in results))
