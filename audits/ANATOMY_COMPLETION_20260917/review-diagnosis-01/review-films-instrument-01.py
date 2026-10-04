"""Decode retained films only; timestamped contact sheets plus all-frame delta census."""
from pathlib import Path
import subprocess,json,hashlib
base=Path('audits/ANATOMY_COMPLETION_20260917');out=base/'review-diagnosis-01'
rows=[]
for subject in ['crab','coconut-crab','freshwater-crab']:
 src=base/(subject+'-native-04')/'family-10s.webm'
 prefix=out/(subject+'-film')
 # 6fps covers the entire retained timeline. 20 frames per sheet, 3 sheets plus tail.
 vf="fps=6,crop=680:690:710:25,scale=272:276,drawtext=fontfile=/System/Library/Fonts/Menlo.ttc:text='%{pts\\:hms}':fontsize=15:fontcolor=white:box=1:boxcolor=black@0.7:x=4:y=4,tile=5x4:padding=2:margin=2"
 subprocess.run(['/opt/homebrew/bin/ffmpeg','-nostdin','-v','error','-i',str(src),'-vf',vf,'-fps_mode','passthrough',str(prefix)+'-%02d.png'],check=True)
 probe=json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe','-v','error','-count_frames','-show_entries','format=duration:stream=width,height,nb_read_frames','-of','json',str(src)]))
 # Time-preserving 60fps census, no new rendering. Downscaled right-panel grayscale deltas.
 p=subprocess.run(['/opt/homebrew/bin/ffmpeg','-nostdin','-v','error','-i',str(src),'-vf','crop=680:640:710:25,scale=170:160,format=gray','-f','rawvideo','-'],capture_output=True,check=True)
 import array
 n=170*160;frames=[p.stdout[i:i+n] for i in range(0,len(p.stdout),n)];deltas=[]
 for i,(a,b) in enumerate(zip(frames,frames[1:]),1):deltas.append({'frame':i,'meanAbsoluteDifference':sum(abs(x-y) for x,y in zip(a,b))/n})
 rows.append({'subject':subject,'source':str(src),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'probe':probe,'decodedFrames':len(frames),'sheets':[str(p) for p in sorted(out.glob(subject+'-film-*.png'))],'largestFrameChanges':sorted(deltas,key=lambda x:x['meanAbsoluteDifference'],reverse=True)[:12],'scope':'6fps complete-timeline review sheets; all encoded frames decoded for pixel-delta census. Not a fresh capture or physical-device acceptance.'})
(out/'film-review-inputs.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(rows,indent=2))
