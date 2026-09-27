import pathlib,json,hashlib,subprocess
root=pathlib.Path.cwd();base=pathlib.Path(__file__).resolve().parent;keep_stills={'turn0-hit-approach-50.png','turn1-hit-reaction-50.png','turn3-hit-reaction-50.png'};paths=[]
for report in base.glob('*/report.json'):
 d=report.parent;native=json.loads(report.read_text())
 if 'capture' not in native:continue
 accepted=d.name.endswith('-side-native') or d.name in ['fish-gill-two-native','arctic-islands-native']
 for p in d.glob('turn*.png'):
  if p.name not in keep_stills:paths.append(p)
 film=d/'battle-full.webm'
 if film.exists() and not accepted:paths.append(film)
rows=[{'path':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in paths]
p=base/'scratch-prune.json';assert not p.exists();p.write_text(json.dumps({'scope':'Own redundant named-pose stills and superseded/refused films only. Final seven foreleg films, final fish and fox films plus three reviewed stills per run remain. Reports retain original full capture inventories; pruned files are listed here.','files':rows,'bytes':sum(r['bytes']for r in rows)},indent=2)+'\n')
g=base/'.gitignore';assert not g.exists();g.write_text('\n'.join('/'+str(p.relative_to(base))for p in paths)+'\n')
for p in paths:
 assert p.is_relative_to(base);assert subprocess.run(['git','check-ignore','-q','--',str(p)]).returncode==0
 assert subprocess.run(['git','ls-files','--error-unmatch','--',str(p)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode!=0
 p.unlink()
print('Pruned',len(rows),'owned ignored scratch files;',sum(r['bytes']for r in rows),'bytes; named final films retained.')
