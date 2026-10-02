"""Recorded-file impact stacks: retain independent transient, mass and material stems."""
from pathlib import Path
import json, hashlib, subprocess, struct, math
ROOT=Path(__file__).resolve().parents[2]
BASE=Path(__file__).resolve().parent
OUT=BASE/'layered-impacts-02'; OUT.mkdir()
def read(p): return json.loads(p.read_text())
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args): return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout
media={r['path']:r for r in read(ROOT/'audio-production/manifests/acquisition.json')['media']}
first=read(BASE/'candidate-02/manifest.json')
transient=next(x for x in media if x.endswith('impactGeneric_light_003.ogg'))
mass=next(x for x in media if x.endswith('impactPunch_heavy_000.ogg'))
results=[]
for cue in first['cues']:
 if not cue['id'].endswith(':impact'): continue
 slug=cue['id'].replace(':','-'); stems=[]
 for role,source,gain,treatment in [('transient',transient,.28,'highpass=f=700'),('mass',mass,.35,'lowpass=f=450'),('material',cue['source'],.50,'anull')]:
  m=media[source]; p=ROOT/'audio-production'/source
  assert sha(p)==m['sha256'] and m['licenseId'] in ['CC0-1.0','Public-Domain','Public-domain-NPS-statement']
  target=OUT/f'{slug}-{role}.wav'
  filters=f'aresample=48000,aformat=channel_layouts=mono,{treatment},apad,atrim=duration=0.54,afade=t=in:d=0.002,afade=t=out:st=0.475:d=0.065,volume={gain}'
  run(['ffmpeg','-nostdin','-v','error','-i',str(p),'-af',filters,'-c:a','pcm_s24le',str(target)])
  stems.append({'role':role,'source':source,'sourceSha256':m['sha256'],'sourceKind':m['sourceKind'],'creator':m['creator'],'license':m['licenseId'],'sourcePage':m.get('sourcePage') or m.get('itemEvidence',{}).get('url') or m['licenseEvidence']['url'],'licenseEvidence':m['licenseEvidence'],'treatment':filters,'wav':str(target.relative_to(ROOT)),'wavSha256':sha(target)})
 wav=OUT/f'{slug}.wav';opus=OUT/f'{slug}.opus';args=['ffmpeg','-nostdin','-v','error']
 for s in stems:args+=['-i',str(ROOT/s['wav'])]
 args+=['-filter_complex','[0:a][1:a][2:a]amix=inputs=3:normalize=0,alimiter=limit=0.72:level=false,atrim=duration=0.54[out]','-map','[out]','-c:a','pcm_s24le',str(wav)];run(args)
 run(['ffmpeg','-nostdin','-v','error','-i',str(wav),'-c:a','libopus','-b:a','96k',str(opus)])
 raw=run(['ffmpeg','-nostdin','-v','error','-i',str(wav),'-f','f32le','-acodec','pcm_f32le','-']);v=struct.unpack('<'+'f'*(len(raw)//4),raw)
 peak=max(map(abs,v));rms=math.sqrt(sum(x*x for x in v)/len(v));assert all(map(math.isfinite,v)) and 1e-6<rms and peak<.9 and len(v)==25920 and opus.stat().st_size<30000
 results.append({**cue,'layers':stems,'layered':True,'wav':str(wav.relative_to(ROOT)),'wavSha256':sha(wav),'opus':str(opus.relative_to(ROOT)),'opusSha256':sha(opus),'peak':peak,'rms':rms,'durationSeconds':.54,'listeningAccepted':False,'massScope':'Mid-mass authoring candidate; size-derived thud tuning remains in the runtime owner.'})
 print(cue['id'],flush=True)
lookup={r['id']:r for r in results}; cues=[lookup.get(r['id'],r) for r in first['cues']]
assert len(cues)==49 and len(lookup)==11 and len({r['id'] for r in cues})==49
manifest={'schema':'cf.c132-recorded-cue-delivery/v1','status':'TECHNICAL_PASS','cueCount':49,'layeredImpacts':11,'listeningAccepted':False,'runtimeAdmitted':False,'sourceKind':'Retained licensed recorded/designed audio files, not newly performed biological recordings.','sources':first['sources'],'cues':cues}
(BASE/'delivery.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'manifest.json').write_text(json.dumps({'impacts':results,'listeningAccepted':False},indent=2)+'\n')
