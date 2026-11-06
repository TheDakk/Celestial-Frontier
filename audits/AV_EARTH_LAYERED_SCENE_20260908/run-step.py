from pathlib import Path
import subprocess,sys,json,time,datetime
r=Path(__file__).resolve().parents[2];a=Path(__file__).resolve().parent
name=sys.argv[1];command=sys.argv[2:];log=a/(name+'.log');receipt=a/(name+'.json')
assert command and not log.exists() and not receipt.exists()
start=time.time();record={'command':command,'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'RUNNING'}
receipt.write_text(json.dumps(record,indent=2)+'\n')
try:
 with log.open('x') as out:result=subprocess.run(command,cwd=r,stdout=out,stderr=subprocess.STDOUT,timeout=600)
 record.update(status='PASS' if result.returncode==0 else 'FAIL',exitCode=result.returncode,seconds=round(time.time()-start,3))
except Exception as e:record.update(status='FAIL',error=repr(e),exitCode=1)
receipt.write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record),flush=True)
print(log.read_text()[-3000:],flush=True);sys.exit(record['exitCode'])
