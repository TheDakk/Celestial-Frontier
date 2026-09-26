/** Explicit rigid-trunk, fixed-socket myriapod representation.
 * All walking legs retain two real spans. Painted trunk plates are carried by
 * one rigid body; this model never claims the legacy eight-segment wave. */
export function expandCompactMyriapod(template,counts){
 const graph=[['head','root'],['mandible','head'],['antennaFar','head'],['antennaNear','head']],legs=[];
 const limits=Object.fromEntries(['root','head','mandible','antennaFar','antennaNear'].map(j=>[j,{...template.limitsDeg[j]}]));
 for(let i=0;i<counts.walkingLegPairs;i++)for(const side of ['Far','Near']){
  const id='leg'+i+side;legs.push(id);graph.push([id+'Knee','root'],[id+'Foot',id+'Knee']);
  limits[id+'Knee']={...template.limitsDeg.legAFarKnee};limits[id+'Foot']={...template.limitsDeg.legAFarFoot};
 }
 for(const side of ['Far','Near']){graph.push(['ultimate'+side,'root']);limits['ultimate'+side]={...template.limitsDeg.legAFarFoot};}
 const bodyAxis=['root','head'],distance=lm=>Math.hypot(lm.head[0]-lm.root[0],lm.head[1]-lm.root[1]);
 const bounds=[{id:'body',min:.1,max:.95,kind:'distance',axis:bodyAxis},
  {id:'bone-min',min:.001,max:.75,kind:'bone-min'},{id:'bone-max',min:.001,max:.75,kind:'bone-max'},
  ...legs.map(id=>({id:'leg/body:'+id,min:.05,max:1.5,kind:'ratio',bones:[id+'Knee',id+'Foot'],axis:bodyAxis}))];
 const proportions=bounds.map(b=>({id:b.id,min:b.min,max:b.max,measure:(lm,bones)=>b.kind==='distance'?distance(lm):b.kind==='bone-min'?Math.min(...Object.values(bones)):b.kind==='bone-max'?Math.max(...Object.values(bones)):b.bones.reduce((n,j)=>n+bones[j],0)/distance(lm)}));
 const secondaryChains=[...['Far','Near'].map(side=>({id:'antenna'+side,kind:'antenna',driver:'head',joints:['antenna'+side]})),
  ...['Far','Near'].map(side=>({id:'ultimate'+side,kind:'tail',driver:'root',joints:['ultimate'+side]}))];
 return {...template,anatomyModel:'myriapod-rigid-trunk-v1',graph,joints:['root',...graph.map(([j])=>j)],legs,limitsDeg:limits,bodyAxis,
  ...(template.bounds?{bounds}:{}),...(template.proportions?{proportions}:{}),...(template.secondaryChains?{secondaryChains}:{}),
  contactStance:{default:'all',actions:{},swingLift:'toward-socket',gaits:{'approach:crawl':'alternating'},travel:{'melee:mandible':'source-steps','melee:body':'source-steps',hit:'source-steps',dodge:'source-steps',tame:'source-steps'}}};
}
