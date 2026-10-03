from pathlib import Path
import subprocess,json,time,sys
root=Path(__file__).resolve().parents[2];out=Path(__file__).resolve().parent
args=['node','node_modules/vitest/vitest.mjs','run','tests/tame-greeting-audio.test.ts','tests/pilot-settlement-presentation.test.ts','tests/pilot-landing-presentation.test.ts','tests/audiovisual-pilot.test.ts','tests/pilot-sound-player.test.ts','tests/pilot-pcm.test.ts','tests/pilot-landing-main-wiring.test.ts','tests/starter-charters.test.ts']
log=out/'audio-focused.log';assert not log.exists();t=time.time()
with log.open('x') as f:p=subprocess.run(args,cwd=root/'port/v2',stdout=f,stderr=subprocess.STDOUT,timeout=300)
(out/'audio-focused.json').write_text(json.dumps({'argv':args,'exitCode':p.returncode,'seconds':time.time()-t},indent=2)+'\n')
print(log.read_text()[-5000:]);sys.exit(p.returncode)
