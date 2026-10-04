from pathlib import Path
import json,subprocess,math,tempfile
base=Path('audits/ANATOMY_COMPLETION_20260917');out=base/'review-diagnosis-01';rows=[]
for name in ['crab','coconut-crab','freshwater-crab']:
 src=base/(name+'-native-04')/'family-10s.webm';r=json.loads((base/'crab-fits-03'/name/'record.json').read_text());report=json.loads((base/(name+'-native-04')/'report.json').read_text())
 reaches=[]
 for side in ['Far','Near']:
  for i in range(4):
   points=[r['landmarks'][f'leg{i}{side}{j}'] for j in ['Root','Knee','Foot']]
   reaches.append(sum(math.hypot(a[0]-b[0],a[1]-b[1]) for a,b in zip(points,points[1:])))
 stride=min(reaches)*.04;duration=420 # verified in offline timeline; store derivation/source below
 timing=json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe','-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',str(src)]))['frames']
 with tempfile.TemporaryDirectory(prefix='cf-transition-') as tmp:
  root=Path(tmp)
  subprocess.run(['/opt/homebrew/bin/ffmpeg','-nostdin','-v','error','-i',str(src),'-vf',r'select=between(n\,224\,227),crop=680:500:710:25','-fps_mode','passthrough',str(root/'frame-%02d.png')],check=True)
  frames=sorted(root.glob('*.png'))
  for i,p in enumerate(frames):
   subprocess.run(['/opt/homebrew/bin/magick',str(p),'-font','/System/Library/Fonts/Menlo.ttc','-fill','white','-undercolor','#000000A0','-pointsize','18','-gravity','NorthWest','-annotate','+4+4',f"frame {224+i}: {timing[224+i]['best_effort_timestamp_time']}s",str(p)],check=True)
  subprocess.run(['/opt/homebrew/bin/magick','montage','-font','/System/Library/Fonts/Menlo.ttc',*[str(p) for p in frames],'-tile','2x2','-geometry','+3+3',str(out/(name+'-transition.png'))],check=True)
 rows.append({'subject':name,'strideNormalized':stride,'approachDurationMs':duration,'boundaryMs':1000+8000/3,'rootDiscontinuityNormalized':stride*(8000/3)/duration,'rootDiscontinuitySourcePx':stride*(8000/3)/duration*r['geometry']['width'],'rootDiscontinuityDisplayPx':stride*(8000/3)/duration*report['gates']['framing']['fit']['scale'],'encodedTransitionFrames':[{**timing[i],'index':i} for i in range(224,228)]})
(out/'transition.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows,indent=2))
