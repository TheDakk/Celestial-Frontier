"""Fresh single-species diagnostic plan from an actual portable fit; no admission."""
from pathlib import Path
import hashlib,json,sys,subprocess
slug,name,fit,observed,context=sys.argv[1:]
B=Path('audits/C475_DECISIONS_20261019/coordinator');out=B/'plans'/slug
assert not out.exists();fit=Path(fit);record=json.loads((fit/'record.json').read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert Path(record['source']).is_file() and (fit/'parts/manifest.json').is_file()
out.mkdir(parents=True)
script=json.loads((B/'plans/cobra-d39/script.json').read_text())
for row in script['rows']:
 for key in ['an','dn']:row[key]=name
if record.get('habitat',{}).get('realm')=='aquatic':script['world']={'surfaceWater':True}
(out/'script.json').write_text(json.dumps(script,indent=2)+'\n')
plan=[dict(id='c475-'+slug,packetId='c475-'+slug,name=name,fit=str(fit),nativeDir=str(out/'native'),nativeReport=str(out/'native/report.json'),script=str(out/'script.json'),masterSha256=sha(record['source']),observedPacket=observed,staticReport=str(out/'static.json'),sourceHead='BIND_SIGNED_HEAD_BEFORE_NATIVE',status='PREPARED_CPU_NOT_NATIVE',scope=context,exactWorstContext=context,nativeAcceptance=False,producerMustBeSignedBeforeNative=True,sourceHeadMustMatchNativeReportSource=True)]
(out/'plan.json').write_text(json.dumps(plan,indent=2)+'\n')
print(json.dumps(dict(plan=str(out/'plan.json'),master=record['source'],masterSha256=plan[0]['masterSha256'],family=record.get('family'),habitat=record.get('habitat'))))
