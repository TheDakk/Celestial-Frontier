from pathlib import Path
import json,os,sys
q=Path(__file__).resolve().parent/'queue'
ident,cwd,*argv=sys.argv[1:]
assert argv and not(q/'terminal.json').exists()
assert not any(not(q/'attempts'/p.stem/'result.json').exists()for p in(q/'inbox').glob('*.json')),'Wait for current immutable stage result'
p=q/'inbox'/(ident+'.json');assert not p.exists()and not(q/'attempts'/ident).exists()
tmp=p.with_suffix('.tmp')
with tmp.open('x')as f:json.dump({'id':ident,'argv':argv,'cwd':cwd},f,indent=2);f.write('\n')
os.replace(tmp,p);print(str(p.relative_to(Path.cwd())))
