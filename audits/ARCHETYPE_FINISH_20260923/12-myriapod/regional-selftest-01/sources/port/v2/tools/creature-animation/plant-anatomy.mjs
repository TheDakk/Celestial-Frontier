/** Source-declared woody branch groups; no missing geometry is synthesized. */
export function plantBranchCount(id,anatomy){
 const count=anatomy?.growth?.branches;
 if(anatomy?.growth===undefined)return null;
 if(id!=='plant-woody'||Object.keys(anatomy.growth).length!==1||!Number.isInteger(count)||count<1||count>20)throw Error('Plant anatomy: invalid branches or family');
 return count; // 2 + 3*20 = 62, below the shared 64-joint limit.
}
export function expandPlantAnatomy(template,anatomy){
 const count=plantBranchCount(template.id,anatomy);if(count===null)return template;
 const graph=[['trunk','root']],limits={root:template.limitsDeg.root,trunk:template.limitsDeg.trunk},bounds=[],proportions=[],chains=[];
 for(let i=0;i<count;i++){
  const base='branch'+i+'Base',tip='branch'+i+'Tip',leaf='leaf'+i,bones=[base,tip],axis=['root','trunk'];
  graph.push([base,'trunk'],[tip,base],[leaf,tip]);
  for(const [j,prototype]of[[base,'branch0Base'],[tip,'branch0Tip'],[leaf,'leaf0']])limits[j]=template.limitsDeg[prototype];
  const id='branch/trunk:branch'+i,min=.1,max=2.5;
  bounds.push({id,min,max,kind:'ratio',bones,axis});
  proportions.push({id,min,max,measure:(lm,lengths)=>bones.reduce((s,j)=>s+lengths[j],0)/Math.hypot(lm.root[0]-lm.trunk[0],lm.root[1]-lm.trunk[1])});
  chains.push({id:'branch'+i,kind:'frond',driver:'trunk',joints:[base,tip,leaf]});
 }
 return {...template,graph,joints:['root',...graph.map(([j])=>j)],limitsDeg:limits,
 ...(template.bounds?{bounds:[...template.bounds.filter(b=>!b.id.startsWith('branch/trunk:')), ...bounds]}:{}),
 ...(template.proportions?{proportions:[...template.proportions.filter(b=>!b.id.startsWith('branch/trunk:')), ...proportions]}:{}),
 ...(template.secondaryChains?{secondaryChains:chains}:{})};
}
