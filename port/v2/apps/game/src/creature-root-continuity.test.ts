import fs from'node:fs';import{gunzipSync}from'node:zlib';import{expect,it}from'vitest';
import{assessRootContinuity,assessTemplateRootContinuity,BRACHYURAN_NON_GAIT_STEP_PER_SCALE}from'./creature-stage-travel.js';
const root=new URL('../../../../../',import.meta.url),base=new URL('audits/VISION_P1_CONSOLIDATED_20260920/root-ledger-01/',root),ledger=JSON.parse(fs.readFileSync(new URL('ledger.json',base),'utf8'));
const samples=(row:any)=>gunzipSync(fs.readFileSync(new URL(row.samplesFile,base))).toString().trim().split('\n').map(line=>JSON.parse(line));
it('uses the complete six-subject measurement rule and admits all authored rises',()=>{
 const measured=Math.max(...ledger.subjects.flatMap((s:any)=>s.rows.filter((r:any)=>!r.id.startsWith('approach')).map((r:any)=>r.maximumStepScale)));
 expect(BRACHYURAN_NON_GAIT_STEP_PER_SCALE).toBe(Math.ceil(measured*1.1*1e6)/1e6);
 expect(ledger.subjects).toHaveLength(6);
 for(const row of ledger.subjects){expect(row.failure).toBeNull();expect(row.rows).toHaveLength(12);const trace=samples(row);expect(assessTemplateRootContinuity(trace,row.stride,'brachyuran',row.scaleLength).status).toBe('PASS');expect(assessRootContinuity(trace,row.stride)).toEqual(row.oldGuard);}
});
it('rejects the actual doubled faint-recovery key for every measured subject',()=>{
 expect(ledger.controls).toHaveLength(6);
 for(const row of ledger.controls){expect(row.failure).toBeNull();expect(row.mutations).toHaveLength(1);const m=row.mutations[0];expect(m.keyAfter).toEqual({...m.keyBefore,value:m.keyBefore.value*2});const result=assessTemplateRootContinuity(samples(row),row.stride,'brachyuran',row.scaleLength);expect(result.status).toBe('FAIL');expect('worstViolation' in result&&result.worstViolation?.action).toBe('faint');}
});
it('retains the stride guard on both gait transition edges and old behavior for other templates',()=>{
 const trace=[{ms:0,x:0,y:0,action:'faint'},{ms:1000/60,x:0,y:.015,action:'faint'}];
 expect(assessTemplateRootContinuity(trace,.01,'brachyuran',1).status).toBe('PASS');
 for(const i of[0,1])for(const action of['approach','approach:scuttle']){const bad=trace.map((s,n)=>({...s,action:n===i?action:s.action}));expect(assessTemplateRootContinuity(bad,.01,'brachyuran',1).status).toBe('FAIL');}
 for(const template of['quadruped','plant-tree','unknown'])expect(assessTemplateRootContinuity(trace,.01,template,1)).toEqual(assessRootContinuity(trace,.01));
 expect(()=>assessTemplateRootContinuity(trace.map(({action,...s})=>s),.01,'brachyuran',1)).toThrow('action/scale');
 expect(()=>assessTemplateRootContinuity(trace,.01,'brachyuran',NaN)).toThrow('action/scale');
});
