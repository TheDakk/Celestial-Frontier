/** Explicit review tier; never inferred from a species name or a timing result. */
export function nativeCpuPolicy(tier='painter'){
 if(tier==='painted-desktop')return{tier,metric:'full-film rig p95',limitMs:3.5,comparison:'<=',authority:'Nick, PROGRAM.md section6, 2026-09-20'};
 if(tier==='painter'||tier==='phone')return{tier,metric:'maximum per-clip rig p95',limitMs:2,comparison:'<',authority:'unchanged phone/painter gate'};
 throw Error('Unknown native CPU tier: '+tier);
}
export function assessNativeReview(report,tier='painter'){
 const policy=nativeCpuPolicy(tier),g=report.gates,c=report.capture,rows=g?.rows??[],failures=[];
 if(tier!=='painted-desktop'&&g?.status!=='PASS')failures.push('unchanged native gates');
 if(!g||g.restChanged!==0||g.finalRestChanged!==0)failures.push('exact rest');
 if(!rows.length||rows.length!==g?.actionCount||rows.some(r=>r.samples!==121||r.failure||!Number.isFinite(r.maxGapPx)||r.status!=='PASS'&&!r.performanceFailure))failures.push('complete geometry rows');
 if(g?.presentation?.status!=='PASS'||g?.rootContinuity?.status==='FAIL')failures.push('presentation / continuity');
 if(!Number.isFinite(g?.contacts?.maxPaintContactDriftPx)||g.contacts.maxPaintContactDriftPx>.25)failures.push('planted drift');
 if(g?.negative?.status!=='FAIL'||g?.framing?.inside!==true||g?.rootSurfaceChecked&&g.maximumRootDrift!==0)failures.push('seam control / framing / anchored root');
 if(!c||c.refusals?.refusedFrames!==0)failures.push('complete film without refusals');
 const valueMs=tier==='painted-desktop'?c?.rigUpdateP95Ms:rows.length?Math.max(...rows.map(r=>r.updateP95Ms??Infinity)):null;
 const cpuPass=Number.isFinite(valueMs)&&valueMs>=0&&(policy.comparison==='<'?valueMs<policy.limitMs:valueMs<=policy.limitMs);
 if(!cpuPass)failures.push('CPU '+policy.metric);
 return{status:failures.length?'FAIL':'PASS',policy,valueMs:valueMs??null,cpuPass,geometryPass:failures.every(f=>f.startsWith('CPU ')),failures,perClipReadings:'retained unchanged; diagnostic only for painted-desktop'};
}
