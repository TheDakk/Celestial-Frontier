"""Select existing immutable own-audit bytes for one additive delivery."""
from pathlib import Path
import json,hashlib,sys
B=Path('audits/C465_CODEX_20261018');wave,rowid,readme,row,roadmapnote=sys.argv[1:];out=B/'w4-delivery'/wave;assert not out.exists();out.mkdir(parents=True);(out/'README.md').write_bytes(Path(readme).read_bytes())
files=[]
for p in B.rglob('*'):
 if not p.is_file()or p.is_symlink():continue
 s=str(p)
 if '/node_modules/'in s or str(out)+'/'in s or p.name in ['source-queue.json','status.json','task-report.md']or p.suffix=='.tmp':continue
 files.append(p)
rows=[dict(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size)for p in sorted(set(files))];(out/'manifest.json').write_text(json.dumps({'status':'FROZEN_CURRENT_DELIVERY','rows':rows},indent=2)+'\n')
p=Path('audits/MAILBOX/TO_CLAUDE.md');s=p.read_text();assert '| '+rowid+' |'not in s;t=p.with_name(p.name+'.c465.tmp');t.write_text(s+'\n\n'+Path(row).read_text().strip()+'\n');t.replace(p)
p=Path('ROADMAP.md');s=p.read_text();anchor='CodexcontinuesONErun,';assert s.count(anchor)==1;t=p.with_name('ROADMAP.c465.tmp');t.write_text(s.replace(anchor,Path(roadmapnote).read_text().strip()+'\n\n'+anchor));t.replace(p)
files.extend([out/'README.md',out/'manifest.json',Path('ROADMAP.md'),Path('audits/MAILBOX/TO_CLAUDE.md')]);Path('/private/tmp/c465-'+rowid.lower()+'-paths.txt').write_text('\n'.join(str(p)for p in sorted(set(files)))+'\n');print(json.dumps({'wave':wave,'pins':len(rows),'files':len(set(files))}))
