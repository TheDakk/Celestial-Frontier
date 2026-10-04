from pathlib import Path
import json,hashlib,collections
p=Path(__file__).resolve().parent;rows=[]
for name in ['gull','goose','heron']:
 run='native-'+name+'-observed-03';f=p/run/'report.json';d=json.loads(f.read_text());c=d['capture'];s=c['frameSamples'];ds=[s[i]['ms']-s[i-1]['ms'] for i in range(1,len(s))];rows.append({'name':name,'runId':run,'status':d['status'],'cpuP95Ms':c['cpuP95Ms'],'cpuMaxMs':max(x['cpuMs'] for x in s),'overBudgetFrames':sum(x['cpuMs']>1000/60 for x in s),'intervalsAtLeast25Ms':sum(x>=25 for x in ds),'maxFrameIntervalMs':max(ds),'liveFrames':c['frames'],'durationMs':c['durationMs'],'encoded':c['encodedFrames'],'refusals':c['refusalsAtEnd'],'supports':d['script']['supports'],'reportSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'filmSha256':hashlib.sha256((f.parent/'battle-full.webm').read_bytes()).hexdigest()})
(p/'native-summary-final.json').write_text(json.dumps({'scope':'Proposed stage bundle, actual observed painted supports; not integrated picker, cold loading, every pair or iPhone.25ms bins diagnose only.','rows':rows},indent=2)+'\n');print(json.dumps(rows,indent=2))
