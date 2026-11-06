/** Independent encoded-media duration admission, not the animation's own timer. */
export function requireTenSecondMedia(seconds){
  if(!Number.isFinite(seconds)||seconds<10||seconds>10.75)throw Error('Encoded capture must contain the complete ten-second timeline (up to 750ms recorder padding)');
  return seconds;
}

/** Dirty diagnostic runs can inform another diagnostic capture, never stand in
 * for a clean committed qualification. Both still require all strict gates. */
export function requireSkinCaptureGate(gate,{diagnostic=false}={}){
 const status=gate?.status==='PASS'&&!gate.diagnostic&&!(gate.dirtyAtStart?.length)
  ||diagnostic&&gate?.status==='DIAGNOSTIC_PASS';
 const rows=gate?.skinGates?.rows;
 if(!status||gate.mode!=='--skin-gates'||gate.skinGates?.status!=='PASS'
  ||JSON.stringify(rows?.map(r=>r.id))!==JSON.stringify(['civet','fox','procedural'])
  ||rows.some(r=>r.status!=='PASS'||r.restChangedChannels!==0||r.finalRestChangedChannels!==0
   ||r.dense?.samples!==1201||r.dense.firstFailure!==null||!Number.isFinite(r.updateP95Ms)||r.updateP95Ms>=2
   ||r.renderedContacts?.status!=='PASS'||r.sourceJoins?.status!=='PASS'||r.sourceJoins.dense?.samples!==1201)
  ||gate.exactSourceSnapshot!==true||!Array.isArray(gate.sources)||!gate.sources.length)
  throw Error('Missing complete native skin qualification');
 return gate;
}

/** Bind the actual browser program and routed asset bytes, not just an old
 * list of files which can remain unchanged while a different candidate loads.
 * Compare before opening the browser. CLI mode/output/report metadata is not
 * served and is deliberately absent; no consumed file has an exemption. */
export function requireSkinCaptureSnapshot(gate,{sources,captureSnapshot}){
 const fail=why=>{throw Error('Skin capture source binding: '+why);};
 const inventory=(rows,key,fields,label)=>{
  if(!Array.isArray(rows)||!rows.length)fail('missing '+label);
  const names=new Set(),out=[];
  for(const row of rows){
   if(!row||typeof row[key]!=='string'||!row[key].length||names.has(row[key])||!/^[a-f0-9]{64}$/.test(row.sha256))fail('invalid '+label);
   names.add(row[key]);const item={};for(const field of fields){const value=row[field];if(typeof value!=='string'&&value!==null)fail('invalid '+label+' '+field);item[field]=value;}
   out.push(item);
  }
  out.sort((a,b)=>a[key]<b[key]?-1:a[key]>b[key]?1:0);return JSON.stringify(out);
 };
 const old=gate?.captureSnapshot,current=captureSnapshot;
 if(old?.schema!=='cf.motion-capture-source/v1'||current?.schema!==old.schema)fail('missing capture snapshot');
 if(inventory(gate.sources,'path',['path','sha256'],'gate sources')!==inventory(sources,'path',['path','sha256'],'capture sources'))fail('source inventory differs');
 if(inventory(old.servedFiles,'name',['name','sha256','sourcePath'],'gate served files')!==inventory(current.servedFiles,'name',['name','sha256','sourcePath'],'capture served files'))fail('served program or asset differs');
 const manifest=value=>{
  if(!value||typeof value.path!=='string'||!value.path.length||!/^[a-f0-9]{64}$/.test(value.sha256))fail('candidate manifest');
  return value.path+'\n'+value.sha256;
 };
 if(manifest(old.candidateManifest)!==manifest(current.candidateManifest))fail('candidate manifest differs');
 return true;
}

/** Supply live frames until the recorder acknowledges start. Waiting for its
 * start event before feeding the canvas can deadlock metadata acquisition. */
export function primeRecorder({started,paint,requestFrame,schedule,now,timeoutMs=5000}){
  const deadline=now()+timeoutMs;
  return new Promise((resolve,reject)=>{
    const tick=()=>{
      if(started()){resolve();return;}
      if(now()>=deadline){reject(Error('Recorder start deadline while feeding frames'));return;}
      paint();requestFrame();schedule(tick);
    };
    schedule(tick);
  });
}
