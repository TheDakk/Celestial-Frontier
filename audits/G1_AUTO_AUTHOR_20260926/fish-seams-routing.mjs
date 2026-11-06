/** Route only the same author/static winners eligible for ordinary native work. */
export function fishSeamPilot(pilot,scores){
 const byId=new Map(pilot.map(p=>[p.id,p]));if(byId.size!==pilot.length||new Set(scores.map(r=>r.id)).size!==scores.length)throw Error('Unique pilot/score IDs required');
 return scores.filter(r=>r.family==='fish'&&r.verdict==='ADMIT'&&r.static==='PASS_STATIC').map(r=>{const p=byId.get(r.id);if(!p)throw Error('Passing fish missing from pilot');return p;});
}
