#!/usr/bin/env python3
"""Seven original arrangements, four real instrument tracks, common phrase boundaries.
Unreviewed music directions; no external track is split or relabelled as stems.
"""
import json
from acquire import BASE,write_json,sha_file
from produce import INVENTORY,validate_jobs
states={
 'menu':([48,43,45,41],[0,4,7,11], [12,16,19,16]),
 'calm':([45,41,48,43],[0,3,7,10], [12,15,19,22]),
 'wonder':([48,50,53,55],[0,4,7,11],[12,19,23,26]),
 'tension':([40,41,40,38],[0,1,7],[12,13,19,13]),
 'battle':([40,36,43,38],[0,3,7],[12,15,19,22]),
 'major-battle':([38,39,43,36],[0,1,7,10],[12,19,13,22]),
 'victory-discovery':([48,53,55,48],[0,4,7],[12,16,19,24])}
jobs=[]
for state,(roots,chord,motif) in states.items():
 beat=.5 if state in ('battle','major-battle') else .75
 notes=[]
 for bar in range(8):
  root=roots[bar%4];at=bar*4*beat
  notes.append({'track':'score-bass','start':at,'duration':2.8*beat,'note':root-12,'gain':.6})
  for interval in chord:
   notes.append({'track':'score-harmony','start':at+.1*beat,'duration':3*beat,'note':root+interval,'gain':.22})
  density=8 if state in ('battle','major-battle') else 4 if state in ('wonder','victory-discovery') else 2
  for pulse in range(density):
   note=root+motif[(pulse+bar)%4]
   notes.append({'track':'score-melody','start':at+pulse*4*beat/density,'duration':beat*(.28 if density==8 else .6),
                 'note':note,'gain':.32 if state=='tension' else .5})
  pulse_positions=(0,1,2,3) if state in ('battle','major-battle') else (0,2) if state in ('tension','victory-discovery') else (0,)
  for pulse in pulse_positions:
   notes.append({'track':'score-rhythm','start':at+pulse*beat,'duration':beat*.18,'note':36+(pulse%2)*7,
                 'gain':.55 if state in ('battle','major-battle') else .18})
 jobs.append({'id':'v3.music.'+state,'group':'coverage-score','kind':'synthetic_fictional','duration':32*beat,'channels':2,
  'layers':[],'synthNote':None,'midi':notes,'requirements':['music.'+state],'recipeVersion':3,'approved':False,'listeningStatus':'not_reviewed',
  'notes':'Original four-track arrangement. Bass, harmony, melody and synthesized rhythm pulse; eight synchronized bars. Listening and loop acceptance pending.',
  'music':{'beatMs':beat*1000,'bars':8,'beatsPerBar':4,'parts':['score-bass','score-harmony','score-melody','score-rhythm']}})
path=BASE/'recipes/production-v3.json'
if path.exists():raise ValueError('Existing score recipe preserved')
validate_jobs(jobs,json.loads((BASE/'manifests/acquisition.json').read_text()))
write_json(path,{'schema':'cf.audio-production-jobs/v1','version':3,'inventorySha256':sha_file(INVENTORY),'jobs':jobs,'requiresListening':True})
print('Prepared seven original four-track arrangements; nothing rendered yet')
