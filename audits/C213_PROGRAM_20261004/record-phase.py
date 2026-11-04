from pathlib import Path
import json,hashlib,shutil,subprocess,sys
n=int(sys.argv[1]);b=Path('audits/C213_PROGRAM_20261004');tag='c213p'+str(n);a=Path('audits/G1_AUTO_AUTHOR_20260926/auto-'+tag);previous=Path('audits/G1_AUTO_AUTHOR_20260926/auto-'+('sweep2' if n==1 else 'c213p'+str(n-1)))
rows=[json.loads(p.read_text()) for p in sorted(a.glob('*/score.json'))];old={p.parent.name:json.loads(p.read_text()) for p in previous.glob('*/score.json')};ispass=lambda r:r.get('verdict')=='ADMIT' and r.get('static')=='PASS_STATIC';new=[r['id'] for r in rows if ispass(r) and not ispass(old.get(r['id'],{}))];lost=[r['id'] for r in rows if not ispass(r) and ispass(old.get(r['id'],{}))]
s={'phase':n,'scored':len(rows),'staticBefore':sum(ispass(r) for r in old.values()),'staticAfter':sum(ispass(r) for r in rows),'gained':new,'lost':lost,'scores':rows};(b/('phase'+str(n)+'-yield.json')).write_text(json.dumps(s,indent=2)+'\n');print({k:v for k,v in s.items() if k!='scores'})
# Keep full runs local for diagnosis; commit compact complete verdict data and selected delivery fits separately.
(a/'.gitignore').write_text('*\n!.gitignore\n!*/\n!score.json\n!provenance.json\n!evidence.json\n!summary.json\n!master.png\n')
