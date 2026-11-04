from pathlib import Path
import hashlib,json
b=Path('audits/C213_PROGRAM_20261004');sha=lambda x:hashlib.sha256(x).hexdigest();rows=[];media=[];masters=[]
keep={'turn0-hit-approach-50.png','turn1-hit-reaction-50.png','turn3-hit-idle-50.png','turn3-hit-idle-90.png','turn0-action85-extracted.png'}
existing=json.loads((b/'phase4-native-integrity.json').read_text()) if (b/'phase4-native-integrity.json').exists() else [];existingByPath={r['native']:r for r in existing}
for p in sorted(b.glob('native-*/report.json')):
 raw=p.read_bytes();r=json.loads(raw)
 for s in r['sources']:
  q=Path(s['path']).expanduser();assert sha(q.read_bytes())==s['sha256'],q
 rows.append({'native':str(p.parent),'status':r['status'],'sourcesVerified':len(r['sources']),'originalReportSha256':existingByPath.get(str(p.parent),{}).get('originalReportSha256',sha(raw)),'frames':r['capture']['frames'],'refusals':len(r['capture']['refusalLog']),'captureFailures':len(r['capture']['failures']),'scope':'Numerical diagnostic only; full-motion review and admission remain Claude-owned'})
 (p.parent/'.gitignore').write_text('*.webm\n*.png\n'+''.join('!'+n+'\n' for n in sorted(keep)))
 for f in p.parent.iterdir():
  if f.suffix in ['.webm','.png']:media.append({'file':str(f),'sha256':sha(f.read_bytes()),'committed':f.name in keep})
for fit in list(b.glob('phase4-successors/*/fit'))+list(b.glob('phase4-keyed-successors/*/fit'))+list(b.glob('phase4-fringe/*/fit')):
 r=json.loads((fit/'record.json').read_text());p=Path(r['source']).expanduser();assert sha(p.read_bytes())==r['geometry']['cutoutAssetHash'];masters.append({'fit':str(fit),'master':str(p),'sha256':sha(p.read_bytes())})
for name,data in [('phase4-native-integrity.json',rows),('phase4-media-index.json',media),('phase4-portable-masters.json',masters)]: (b/name).write_text(json.dumps(data,indent=2)+'\n')
print(len(rows),'native reports verified;',len(masters),'masters verified')
