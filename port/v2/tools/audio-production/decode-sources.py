#!/usr/bin/env python3
"""Rehash every original, reuse only successful same-hash decode evidence, decode additions."""
import concurrent.futures,json,subprocess
from acquire import BASE,write_json,sha_file

def main():
 acquisition=json.loads((BASE/'manifests/acquisition.json').read_text())
 previous=BASE/'reports/source-decode.json';old=json.loads(previous.read_text()) if previous.exists() else {'files':[]}
 archive=BASE/'reports/source-decode-before-ecology.json'
 if previous.exists() and not archive.exists():archive.write_bytes(previous.read_bytes())
 verified={r['sha256']:r for r in old['files'] if r['exit']==0 and not r['error']}
 inputs={}
 for m in acquisition['media']:
  p=BASE/m['path']
  if sha_file(p)!=m['sha256']:raise ValueError('Original changed: '+str(p))
  inputs.setdefault(m['sha256'],p)
 def decode(item):
  h,p=item
  if h in verified:return verified[h]
  r=subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(p),'-f','null','-'],capture_output=True,text=True,timeout=180)
  return {'sha256':h,'exit':r.returncode,'error':r.stderr,'path':str(p.relative_to(BASE))}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(decode,inputs.items()))
 report={'schema':'cf.audio-source-decode/v1','files':rows,'pass':all(r['exit']==0 and not r['error'] for r in rows),
  'rehashCount':len(acquisition['media']),'newlyDecoded':sum(h not in verified for h in inputs),'priorEvidenceSha256':sha_file(archive) if archive.exists() else None}
 write_json(previous,report);print(json.dumps({k:v for k,v in report.items() if k!='files'}))
 if not report['pass']:raise SystemExit(1)
if __name__=='__main__':main()
