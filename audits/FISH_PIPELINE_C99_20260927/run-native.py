import pathlib,json,subprocess,os,time,datetime

def competing_jobs():
 lines=subprocess.check_output(['ps','-Ao','pid,command'],text=True).splitlines()
 return [line.strip() for line in lines if '/celestial-frontier-anthropic-mac/' in line and ('native-runner.mjs' in line or 'vitest' in line or 'check-profile.mjs' in line)]
base=pathlib.Path(__file__).resolve().parent;repo=base.parents[1];results=[]
for row in json.loads((base/'candidate-results.json').read_text()):
 if row.get('static')!='PASS_STATIC':continue
 ident=row['id'];fit=repo/row['candidate'];record=json.loads((fit/'record.json').read_text());name=record['identity']['earthName'];script=json.loads((repo/'audits/FISH_FOLD_C80_20260927/grayling-script.json').read_text());script['supports']='observed'
 pauses=[]
 while True:
  jobs=competing_jobs()
  if not jobs:break
  if not pauses or pauses[-1]['jobs']!=jobs:pauses.append({'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'jobs':jobs})
  time.sleep(5)
 (base/(ident+'-quiet-start.json')).write_text(json.dumps({'waitedForJobs':pauses,'competingAtStart':[]},indent=2)+'\n')
 for turn in script['rows']:
  for field in ['an','dn']:
   if field in turn:turn[field]=name
 script_file=base/(ident+'-script.json');assert not script_file.exists();script_file.write_text(json.dumps(script,indent=2)+'\n');out=base/(ident+'-native-01');assert not out.exists()
 with (base/(ident+'-native.log')).open('w') as log:r=subprocess.run(['node','tools/battle2-proof/native-runner.mjs',str(fit),str(fit),str(out),str(script_file)],cwd=repo/'port/v2',env={**os.environ,'CF_CPU_THROTTLE':'4'},stdout=log,stderr=subprocess.STDOUT)
 result={'id':ident,'name':name,'exitCode':r.returncode,'fit':row['candidate'],'nativeDir':str(out.relative_to(repo)),'competingJobsAtEnd':competing_jobs(),'quietStartOnlyNotWholeRunProof':True};report=out/'report.json'
 if report.exists():
  data=json.loads(report.read_text());result.update(status=data['status'],frames=len(data.get('capture',{}).get('frameSamples',[])),error=data.get('error'),refusals=data.get('refusals'));result['capture']=data.get('capture',{}).get('summary')
 results.append(result);(base/'native-results.json').write_text(json.dumps(results,indent=2)+'\n');print(name,result.get('status','NO_REPORT'),result.get('frames'),flush=True)
