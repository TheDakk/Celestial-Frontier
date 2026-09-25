from pathlib import Path
import json, hashlib
p=Path(__file__).resolve().parent
run='native-observed-01'
r=json.loads((p/run/'report.json').read_text());c=r['capture'];frames=c['frameSamples']
delta=[b['ms']-a['ms'] for a,b in zip(frames,frames[1:])]
host=json.loads((p/'host-during-native-01.json').read_text())
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
summary={'runId':run,'scope':r['scope'],'status':r['status'],
 'cpuP95Ms':c['cpuP95Ms'],'cpuMaxMs':max(x['cpuMs'] for x in frames),
 'overBudgetFrames':[x for x in frames if x['cpuMs']>1000/60],
 'intervalsAtLeast25Ms':sum(x>=25 for x in delta),'maxFrameIntervalMs':max(delta),
 'liveFrames':len(frames),'durationMs':c['durationMs'],'encoded':c['encodedFrames'],
 'refusals':c['refusalsAtEnd'],'reportSha256':sha(p/run/'report.json'),'filmSha256':sha(p/run/'battle-full.webm'),
 'otherLaneActiveSamples':sum(bool(x.get('processes')) for x in host['rows']),'hostSamples':len(host['rows']),
 'recipeHash':json.loads((p/'../26-salamander/fit-05/record.json').read_text())['recipeHash'],
 'bindingHash':sha(p/'../26-salamander/fit-05/binding.json'),'masterSha256':sha(p/'../26-salamander/master.png')}
with (p/'native-summary.json').open('x') as f:f.write(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
