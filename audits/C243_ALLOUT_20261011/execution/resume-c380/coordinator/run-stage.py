"""Coordinator-only serial job record; immutable attempt output and disk-floor guard."""
import json, pathlib, subprocess, sys, time, shutil, os, signal
base=pathlib.Path(__file__).resolve().parent
name=sys.argv[1]; command=sys.argv[2:]; assert command
record=base/(name+'.json'); log=base/(name+'.log')
assert not record.exists() and not log.exists(), 'No automatic retries'
start=time.time(); available=shutil.disk_usage('/System/Volumes/Data').free/2**30
minimum=42 if name.startswith('finish-') else 30
assert available>=minimum, f'Pre-stage headroom: {available:.2f} GiB < {minimum}'
row={'stage':name,'command':command,'startedUnix':start,'beforeGiB':available,'status':'RUNNING'}
def save():
 text=json.dumps(row,indent=2).replace(str(pathlib.Path.home()),'~')+'\n'
 tmp=record.with_suffix('.tmp');tmp.write_text(text);os.replace(tmp,record)
save()
with log.open('x') as stream:
 p=subprocess.Popen(command,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
 low=available
 while p.poll() is None:
  low=min(low,shutil.disk_usage('/System/Volumes/Data').free/2**30)
  if low<30:
   os.killpg(p.pid,signal.SIGTERM);row['floorTermination']=True;break
  time.sleep(2)
 code=p.wait()
row.update(exitCode=code,elapsedSeconds=round(time.time()-start,3),lowestGiB=low,afterGiB=shutil.disk_usage('/System/Volumes/Data').free/2**30,status='PASS' if code==0 and not row.get('floorTermination') else 'RED')
save();log.write_text(log.read_text().replace(str(pathlib.Path.home()),'~'))
print(json.dumps(row));sys.exit(0 if row['status']=='PASS' else 1)
