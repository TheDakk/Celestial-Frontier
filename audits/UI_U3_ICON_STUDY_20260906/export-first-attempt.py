#!/usr/bin/env python3
from pathlib import Path
import subprocess, hashlib, json, platform, struct
p=Path(__file__).resolve().parent
exe='/opt/homebrew/bin/inkscape'
version=subprocess.run([exe,'--version'],capture_output=True,text=True)
record={'schema':'cf-u3-icon-export/v1','tool':exe,'version':version.stdout.strip(),'versionExit':version.returncode,'host':platform.platform(),'command':[exe,str(p/'study.svg'),'--export-type=png','--export-filename='+str(p/'study.png'),'--export-width=1240'],'startupReceipt':'audits/DEVELOPMENT_TOOLCHAIN_SETUP_20260906.json','capabilityReceipt':'audits/UI_TOOLCHAIN_SETUP_20260905.json','lock':'tools/with-toolchain-lock.mjs','scope':'terminal-only original SVG study; no product assets; no network or personal UI'}
assert version.returncode==0,version.stderr
assert version.stdout.strip().startswith('Inkscape 1.4.4'), 'Executable changed; requalify before export'
assert not (p/'study.png').exists()
r=subprocess.run(record['command'],capture_output=True,text=True)
record.update(exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr)
if (p/'study.png').exists():
    data=(p/'study.png').read_bytes()
    assert data[:8]==b'\x89PNG\r\n\x1a\n'
    record.update(width=struct.unpack('>I',data[16:20])[0],height=struct.unpack('>I',data[20:24])[0],bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
(p/'export-receipt.json').write_text(json.dumps(record,indent=2)+'\n')
assert r.returncode==0,r.stderr
assert record['width']==1240 and record['height']==1410
print(json.dumps(record,indent=2))
