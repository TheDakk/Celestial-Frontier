import assert from 'node:assert/strict';
export function classifyProbe(report){
 const at=report.at,duration=report.rows.find(r=>r.label.startsWith('stage '))?.context.durationMs;
 assert(Number.isFinite(duration)&&duration>0,'Missing duration');
 const expected=[...new Set([...Array.from({length:129},(_,i)=>duration*i/128),at-.05,at,at+.05])];
 const rows=report.rows.filter(r=>r.label.startsWith('stage '));
 assert.equal(rows.length,expected.length,'Incomplete stage interval');
 for(const t of expected)assert(rows.some(r=>r.label==='stage '+t),'Missing named time '+t);
 for(const r of rows){assert.equal(r.context.actionId,'faint');assert.equal(r.context.elapsedMs,Number(r.label.slice(6)));}
 return rows.some(r=>r.error)?'RED':'PASS_SAMPLED_DIAGNOSTIC_ONLY';
}
