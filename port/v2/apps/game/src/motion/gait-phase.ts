/** Prospective anatomy timing, in normalized cycles. No species branches,
 * clocks, inferred support, geometry limits or battle-stage ownership. */
export function gaitTiming(template:string,action:string,ids:readonly string[]):{duty:number;offsets:Readonly<Record<string,number>>}|null{
 if(!['approach:walk','approach:crawl','approach:scuttle'].includes(action))return null;
 const offsets:Record<string,number>={};
 if(template==='myriapod')for(const id of ids){const m=/^leg(\d+)(Far|Near)$/.exec(id);if(!m)return null;offsets[id]=(Number(m[1])*.2+(m[2]==='Near'?.5:0))%1;}
 else if(template==='insect')for(const id of ids){if(!/^leg(Front|Mid|Hind)(Far|Near)$/.test(id))return null;offsets[id]=['legFrontFar','legMidNear','legHindFar'].includes(id)?0:.5;}
 else if(template==='arachnid')for(const id of ids){const m=/^leg([1-4])(Far|Near)$/.exec(id);if(!m)return null;offsets[id]=((Number(m[1])-1+(m[2]==='Near'?1:0))%2)*.5;}
 else if(template==='biped-bird'||template==='flyer-membrane')for(const id of ids)offsets[id]=id.endsWith('Near')?0:.5;
 else if(template==='primate'){const order:Record<string,number>={legNear:0,armFar:.25,legFar:.5,armNear:.75};for(const id of ids){if(order[id]===undefined)return null;offsets[id]=order[id]!;}}
 else return null; // Protected quadruped/crab gaits retain their existing owner.
 return{duty:.65,offsets};
}
export function gaitStep(progress:number,offset:number,duty:number){
 if(![progress,offset,duty].every(Number.isFinite)||duty<=0||duty>=1)throw Error('motion: invalid gait phase');
 const smooth=(t:number)=>t*t*(3-2*t),phase=(u:number)=>u-Math.floor(u),advance=(u:number)=>Math.floor(u)+(phase(u)<duty?0:smooth((phase(u)-duty)/(1-duty))),u=phase(progress-offset),swing=u>=duty,at=swing?(u-duty)/(1-duty):0;
 return{stance:!swing,swing,at,step:advance(progress-offset)-advance(-offset),lift:swing?Math.sin(Math.PI*at)**2:0};
}
