from pathlib import Path
import json,subprocess,shutil,time
b=Path('audits/C213_PROGRAM_20261004');summary=Path('audits/G1_AUTO_AUTHOR_20260926/native-c213p4/summary.json');deadline=time.monotonic()+1800
while not summary.exists():
 if time.monotonic()>deadline:raise RuntimeError('Phase4 sweep did not finish; no native launched')
 time.sleep(5)
s=json.load(open(summary));assert s['runnerExit']==0 and s['scored']==447,s
r=json.load(open(b/'phase4-fringe03-delivery.json'));script=b/'phase4-fringe-source03/17-tahr/script.json';shutil.copyfile('audits/G1_AUTO_AUTHOR_20260926/native-sweep2/g2c114-17-tahr-script.json',script)
p=subprocess.run(['node','tools/with-toolchain-lock.mjs','--label','C213-transparent-Tahr','--','node','port/v2/tools/battle2-proof/native-runner.mjs',r['fit'],r['fit'],str(b/'native-fringe03-tahr'),str(script)],capture_output=True,text=True)
(b/'phase4-native-fringe03.log').write_text((p.stdout+p.stderr).replace(str(Path.home()),'~'));r.update(native=str(b/'native-fringe03-tahr'),nativeExit=p.returncode,status='NATIVE_DIAGNOSTIC_PASS' if p.returncode==0 else 'NATIVE_REFUSE_NO_RETRY');(b/'phase4-fringe03-delivery.json').write_text(json.dumps(r,indent=2)+'\n');print(r)
