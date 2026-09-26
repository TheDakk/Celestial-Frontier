/** Measurements over observations, never over the parameters being tested. */
const tau=2*Math.PI;
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const rms=a=>Math.sqrt(mean(a.map(x=>x*x)));
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const wrap=x=>((x+.5)%1+1)%1-.5;
const need=(v,s)=>{if(!v)throw Error('Motion anatomy instrument: '+s);};
export function waveMetrics(series,chain){
 need(Array.isArray(chain)&&chain.length>=3&&new Set(chain).size===chain.length,'unidentified chain');
 const n=series[chain[0]]?.length;need(n>=32,'insufficient chain samples');
 const signals=chain.map(j=>{const a=series[j];need(a?.length===n&&a.every(Number.isFinite),'missing/nonfinite chain '+j);const avg=mean(a),z=a.map(x=>x-avg);return {joint:j,z,rms:rms(z),amplitude:(Math.max(...a)-Math.min(...a))/2,phase:Math.atan2(z.reduce((s,x,i)=>s+x*Math.cos(tau*i/n),0),z.reduce((s,x,i)=>s+x*Math.sin(tau*i/n),0))};});
 const links=signals.slice(1).map((b,i)=>{const a=signals[i],norm=n*a.rms*b.rms;let best=-Infinity,lag=0;
  for(let k=-Math.floor(n/2);k<Math.ceil(n/2);k++){const c=norm? a.z.reduce((s,x,t)=>s+x*b.z[(t+k+n)%n],0)/norm:0;if(c>best+1e-12){best=c;lag=k/n;}}
  return {from:a.joint,to:b.joint,lagCycles:lag,correlation:best,phaseLagCycles:wrap((a.phase-b.phase)/tau)};
 });
 const travelIndex=mean(links.map(x=>Math.sin(tau*x.phaseLagCycles))),lag=median(links.map(x=>x.lagCycles)),active=signals.every(x=>x.amplitude>.1*Math.PI/180);
 const pass=active&&links.every(x=>x.lagCycles>=.04&&x.lagCycles<=.22&&x.correlation>=.75)&&travelIndex>=.6;
 return {status:pass?'PASS':'FAIL',chain,amplitudesRad:signals.map(x=>x.amplitude),links,medianLagCycles:lag,travelIndex,wavelengthBodyLengths:lag>0?1/(lag*(chain.length-1)):null,reason:pass?null:!active?'inactive chain':'standing, reversed or incoherent wave'};
}
export function contactMetrics(samples,ids,expectedPhases,dutyTarget=.65,tolerance=.08){
 need(samples.length>=32&&ids.length>0,'unidentified contacts');
 const rows=ids.map(id=>{const a=samples.map(s=>s[id]);need(a.every(x=>x&&typeof x.stance==='boolean'&&Number.isFinite(x.lift)),'missing observed contact '+id);
  const duty=mean(a.map(x=>+x.stance)),touch=[];for(let i=0;i<a.length;i++)if(a[i].stance&&!a[(i+a.length-1)%a.length].stance)touch.push(i/a.length);
  return {id,duty,touchdown:touch.length===1?touch[0]:null,touchdowns:touch.length,peakLift:Math.max(...a.map(x=>x.lift))};});
 const reference=rows[0].touchdown;
 for(const r of rows){r.phase=reference===null||r.touchdown===null?null:((r.touchdown-reference)%1+1)%1;r.expectedPhase=expectedPhases[r.id]??null;r.phaseError=r.phase===null||r.expectedPhase===null?null:Math.abs(wrap(r.phase-r.expectedPhase));r.dutyPass=Math.abs(r.duty-dutyTarget)<=tolerance;r.phasePass=r.phaseError!==null&&r.phaseError<=.06;r.liftPass=r.peakLift>=.02&&r.peakLift<=.21;}
 return {status:rows.every(r=>r.dutyPass&&r.phasePass&&r.liftPass)?'PASS':'FAIL',rows};
}
/** Exact matched-delay comparison, refusing absence of world/history evidence. */
export function pathFollowing(samples,chain,{bodyLength,lagSamples,worldHistory=false}={}){
 need(worldHistory===true,'world stage displacement/history absent');need(chain?.length>=3&&bodyLength>0&&lagSamples>0,'unidentified path chain');
 const errors=[];let eligible=0;for(let k=1;k<chain.length;k++)for(let i=0;i<samples.length;i++){eligible++;const earlier=i-Math.round(k*lagSamples);if(earlier<0)continue;const a=samples[i][chain[k]],b=samples[earlier][chain[0]];need(a&&b&&[a.x,a.y,b.x,b.y].every(Number.isFinite),'missing world path point');errors.push(Math.hypot(a.x-b.x,a.y-b.y)/bodyLength);}
 const coverage=errors.length/eligible,value=errors.length?rms(errors):null;return{status:coverage>=.8&&value!==null&&value<=.08?'PASS':'FAIL',rmsBodyLengths:value,coverage};
}
export function strikeMetrics(head,bodyLength,durationMs){
 need(head.length>=32&&bodyLength>0&&durationMs>0,'strike samples required');const x=head.map(p=>p.x),start=x[0],min=Math.min(...x),peak=Math.max(...x),peakIndex=x.indexOf(peak),loadIndex=x.slice(0,peakIndex+1).indexOf(Math.min(...x.slice(0,peakIndex+1))),delta=peak-x[loadIndex];
 const crossed=f=>x.findIndex((v,i)=>i>=loadIndex&&i<=peakIndex&&v>=x[loadIndex]+f*delta),a=crossed(.1),b=crossed(.9),window=(b-a)/(x.length-1),extension=delta/bodyLength,dt=durationMs/1000/(head.length-1),speed=Math.max(...x.slice(1).map((v,i)=>(v-x[i])/dt/bodyLength));
 return{status:extension>=.30&&extension<=.53&&window>0&&window<=.25?'PASS':'FAIL',extensionBodyLengths:extension,outboundFraction:window,peakSpeedBodyLengthsPerSecond:speed,loadDisplacement:(min-start)/bodyLength};
}
