#!/usr/bin/env python3
"""Measure new fauna input peaks before fixed-point rendering; attenuation only."""
import concurrent.futures,json,math,re,subprocess,shutil
from pathlib import Path
from acquire import BASE,write_json,sha_file

def bounded_gain(peak_db,current_gain):
 if not math.isfinite(peak_db):raise ValueError('Silent/unmeasured source excerpt; requires separate selection')
 return min(current_gain,10**((-9-peak_db)/20))
def main():
 recipe=BASE/'recipes/production-v4.json';data=json.loads(recipe.read_text())
 before=BASE/'reports/ecology-recipe-before-headroom.json'
 if before.exists():raise ValueError('Headroom revision already made')
 shutil.copyfile(recipe,before)
 def measure(job):
  if not job['group'].startswith('ecology-fauna-'):return None
  assert len(job['layers'])==1
  layer=job['layers'][0];p=BASE/layer['path']
  if sha_file(p)!=layer['sha256']:raise ValueError('Source changed')
  r=subprocess.run(['ffmpeg','-nostdin','-hide_banner','-i',str(p),'-t',str(job['duration']),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,timeout=60)
  found=re.findall(r'Peak:\s*([-\w.]+) dBFS',r.stderr)
  if r.returncode or not found:raise ValueError('Source peak measurement failed')
  peak=float(found[-1]);gain=bounded_gain(peak,layer['gain'])
  return {'id':job['id'],'sourceSha256':layer['sha256'],'sourceDbTP':peak,'priorGain':layer['gain'],'gain':gain,'duration':job['duration']}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=[r for r in pool.map(measure,data['jobs']) if r]
 by_id={r['id']:r for r in rows}
 for j in data['jobs']:
  if j['id'] not in by_id:continue
  row=by_id[j['id']];j['layers'][0]['gain']=row['gain'];j['inputHeadroom']=row;j['group']+='-headroom'
  j['notes']+=' Input attenuation measured before fixed-point REAPER render; no boosting, limiter, pitch or time change.'
 # Preserve partial audition copies from the failed group; immutable original inputs are untouched.
 failed=BASE/'reaper/ecology-fauna-01/regions.json'
 moved=[]
 if failed.exists():
  target=BASE/'quarantine/ecology-first-render';target.mkdir(parents=True,exist_ok=False)
  for j in json.loads(failed.read_text()):
   p=BASE/'audition'/(j['id']+'.wav')
   if p.exists():
    dest=target/p.name;sha=sha_file(p);p.rename(dest);moved.append({'priorPath':str(p.relative_to(BASE)),'retainedPath':str(dest.relative_to(BASE)),'sha256':sha})
 write_json(BASE/'reports/ecology-input-headroom.json',{'schema':'cf.audio-input-headroom/v1','targetDbTP':-9,'sources':rows,'retainedPartialPreviews':moved,
  'failedRenderRetained':'reaper/ecology-fauna-01','failedMastersRetained':'masters/ecology-fauna-01','priorRecipeSha256':sha_file(before)})
 write_json(recipe,data);print(json.dumps({'measured':len(rows),'attenuated':sum(r['gain']<r['priorGain'] for r in rows),'partialPreviewsPreserved':len(moved)}))
if __name__=='__main__':main()
