from pathlib import Path
import subprocess,json
root=Path('/Users/dakk/Projects/celestial-frontier-openai-mac');out=root/'audits/I5_CARD_SCRATCH_20260927';rows=[]
cases=[('omit-release','port/v2/apps/game/src/morph/raster-scratch.ts','transfer.call(buffer, 0);','void buffer;'),('detach-caller-input','port/v2/apps/game/src/morph/morph-card.ts','  const input = padForProportionV1(raw);','  scratch.own(raw.master.master);\n  const input = padForProportionV1(raw);')]
for name,rel,a,b in cases:
 p=root/rel;original=p.read_bytes();s=original.decode();assert s.count(a)==1
 try:
  tmp=p.with_suffix('.ts.tmp');tmp.write_text(s.replace(a,b));tmp.replace(p)
  r=subprocess.run(['./node_modules/.bin/vitest','run','apps/game/src/morph/card-scratch.test.ts'],cwd=root/'port/v2',capture_output=True,text=True)
  (out/(name+'.log')).write_text(r.stdout+r.stderr);rows.append({'mutant':name,'exitCode':r.returncode,'rejected':r.returncode!=0});assert r.returncode!=0,name
 finally:
  tmp=p.with_suffix('.ts.tmp');tmp.write_bytes(original);tmp.replace(p)
(out/'mutants.json').write_text(json.dumps(rows,indent=2)+'\n')
