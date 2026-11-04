from pathlib import Path
import os,sys,subprocess,json,hashlib
phase=int(sys.argv[1]);assert phase in range(1,7)
tag='c234p'+str(phase)
root=Path('audits/G1_AUTO_AUTHOR_20260926');base=Path('audits/C234_PROGRAM_20261011')/('phase'+str(phase));pool=base/'reference-pool.json'
assert pool.exists()
for p in [root/('auto-'+tag),root/('native-'+tag),root/('native-'+tag+'-fishseams'),root/'pilots'/(tag+'-eligible.json')]:assert not p.exists(), 'Never reuse a measurement tag: '+str(p)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();signature=subprocess.check_output(['git','log','-1','--format=%G?'],text=True).strip();assert signature=='G'
(base/'measurement-start.json').write_text(json.dumps({'tag':tag,'sourceHead':head,'signature':signature,'poolSha256':hashlib.sha256(pool.read_bytes()).hexdigest(),'outputDirectoriesInitiallyAbsent':True,'scope':'Static diagnostic only; all457must complete before yield'},indent=2)+'\n')
args=['node','tools/with-toolchain-lock.mjs','--label','C234-phase'+str(phase)+'-static-'+tag,'--','node','audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs','audits/SWEEP6_20261011',tag,'--no-native','--extra-refs='+str(pool),'--pilot=audits/G1_AUTO_AUTHOR_20260926/pilots/sweep5.json']
os.execvp(args[0],args)
