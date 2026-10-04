from pathlib import Path
import hashlib,json,os,subprocess,time
root=Path(__file__).resolve().parents[2]
base=Path(__file__).resolve().parent
prep=json.loads((base/'prepare.json').read_text())
source=Path(prep['source']).expanduser()
head=prep['productHead']
out=base/'epoch'
assert not out.exists(), 'One fresh epoch only; output already exists'
assert not (base/'invocation.json').exists(), 'No invocation retry'
git=lambda *a: subprocess.check_output(['git',*a],cwd=root,text=True).strip()
assert git('branch','--show-current')=='openai/mac'
assert git('log','-1','--format=%G?')=='G'
assert not git('diff','HEAD','--','port/v2/tools','port/v2/budgets'), 'Instrument dirty'
assert subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()==head
assert not subprocess.check_output(['git','-C',str(source),'status','--porcelain=v1','--untracked-files=all'],text=True).strip()
cmd=['node','tools/with-toolchain-lock.mjs','--label','C272 one fresh combined I5 3+1 first red stop','--','node','port/v2/tools/compendiummem-v2.mjs','--source='+str(source),'--head='+head,'--out='+str(out)]
private=lambda s: s.replace(str(Path.home()),'~')
receipt={'schema':'cf.c203-i5-invocation/v1','productHead':head,'instrumentHead':git('rev-parse','HEAD'),'command':[private(x) for x in cmd],'exitCode':None,'automaticRetries':0,'source':private(str(source)),'output':str(out.relative_to(root))}
(base/'invocation.json').write_text(json.dumps(receipt,indent=2)+'\n')
t=time.monotonic()
p=subprocess.run(cmd,cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(base/'epoch-terminal.log').write_text(private(p.stdout))
receipt.update(exitCode=p.returncode,durationSeconds=round(time.monotonic()-t,3))
(base/'invocation.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt),flush=True)
print(private(p.stdout[-2500:]),flush=True)
raise SystemExit(p.returncode)
