import subprocess,json,hashlib,datetime,sys,shutil
from pathlib import Path
repo=Path('/Users/nick/Projects/celestial-frontier-openai-mac')
out=repo/'audits/INKSCAPE_CONFIRMATION_20260908'
out.mkdir()
shutil.copy2(repo/'audits/INKSCAPE_REQUALIFICATION_20260907/probe.svg',out/'probe.svg')
report={'schema':'cf-inkscape-confirmation/v1','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'execution':'outside Codex sandbox; shared toolchain lock','steps':[],'status':'FAIL'}
def run(name,args):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
 (out/(name+'.log')).write_bytes(p.stdout)
 report['steps'].append({'name':name,'argv':args,'exitCode':p.returncode,'log':name+'.log'})
 if p.returncode:raise RuntimeError(name+' failed')
 return p.stdout.decode().strip()
try:
 report['version']=run('version',['/opt/homebrew/bin/inkscape','--version'])
 run('export',['/opt/homebrew/bin/inkscape',str(out/'probe.svg'),'--export-type=png','--export-width=128','--export-filename='+str(out/'probe.png')])
 inspect=run('inspection',['/opt/homebrew/bin/magick',str(out/'probe.png'),'-format','%w %h %[channels] %[pixel:p{0,0}] %[pixel:p{64,64}]','info:'])
 if inspect!='128 128 srgba 4.0 srgba(16,29,48,1) srgba(255,217,106,1)':raise RuntimeError('unexpected image geometry or colors: '+inspect)
 difference=run('pixel-comparison',['/opt/homebrew/bin/magick','compare','-metric','AE',str(repo/'audits/INKSCAPE_REQUALIFICATION_20260907/probe.png'),str(out/'probe.png'),'null:'])
 if difference!='0':raise RuntimeError('image pixels changed: '+difference)
 report['status']='PASS';report['pixelDifference']=0
except Exception as error:report['error']=str(error)
finally:
 report['endedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 report['files']=[{'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(out.iterdir()) if p.is_file()]
 (out/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report),flush=True)
sys.exit(0 if report['status']=='PASS' else 1)
