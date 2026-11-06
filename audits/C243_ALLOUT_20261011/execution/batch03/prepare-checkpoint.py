"""List selected evidence only; scrub new text before the signed source checkpoint."""
import json, pathlib, subprocess
B=pathlib.Path('audits/C243_ALLOUT_20261011/execution');b=B/'batch03'
J=lambda p:json.loads(pathlib.Path(p).read_text())
plan=J(b/'native-plan-reviewed.json');files=set()
def add(p):
    p=pathlib.Path(p)
    if p.is_dir():
        files.update(x for x in p.rglob('*') if x.is_file() and '__pycache__' not in x.parts)
    elif p.is_file():files.add(p)
    else:raise RuntimeError('Missing evidence '+str(p))
for p in b.iterdir():
    if p.is_file() and p.suffix in ['.json','.py','.mjs','.log']:add(p)
add(b/'native-scripts')
add(B/'incoming-reviews/C251.json')
for p in (b/'class-fixes').iterdir():
    if p.is_file():add(p)
attempts={a['id']:a for a in J(b/'attempts.json')}
for r in plan:
    fit=pathlib.Path(r['fit']);add(fit)
    record=J(fit/'record.json');add(record['source'])
    add(r['nativeReport'])
    if r.get('classStatic'):
        d=pathlib.Path(r['classStatic']).parent
        for p in d.iterdir():
            if p.is_file():add(p)
    if r['id'] in attempts:
        add(b/r['id'])
        score=pathlib.Path(attempts[r['id']]['score']);add(score)
        for p in score.parent.glob('static*'):
            if p.is_file():add(p)
for p in ['ROADMAP.md',str(B/'PROGRESS.md'),str(B/'ledger.json')]:add(p)
tracked=set(subprocess.check_output(['git','ls-files','-z']).decode().split('\0'))
changed=[]
for p in sorted(files):
    if p.suffix not in ['.json','.md','.log','.mjs','.py','.txt','.ts','.js','.html']:continue
    data=p.read_bytes()
    home=str(pathlib.Path.home()).encode()
    if home in data:
        if str(p) in tracked:raise RuntimeError('Tracked evidence requires explicit edit: '+str(p))
        updated=data.replace(home,b'~');tmp=p.with_name(p.name+'.portable-tmp');tmp.write_bytes(updated);tmp.replace(p);changed.append(str(p))
    assert (b'/' + b'Users/') not in p.read_bytes() and (b'/' + b'home/') not in p.read_bytes(),str(p)
manifest={'files':[str(p) for p in sorted(files)],'portableTextNormalized':changed,'scope':'Selected sources/fits/native reports only; no loser masters or unfinished AI outputs'}
(b/'checkpoint-files.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'files':len(files),'normalized':len(changed)}))
