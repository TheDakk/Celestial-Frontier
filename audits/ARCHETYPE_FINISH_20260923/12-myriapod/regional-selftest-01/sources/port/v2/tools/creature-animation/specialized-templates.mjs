/** Shared structural building blocks for source-observed invertebrates.
 * These are candidate inventories, NOT a claim that a species is fitted.
 * A record must supply every landmark and pass normal hash/alpha/bounds intake. */
const chain=(parent,names)=>names.map((j,i)=>[j,i?names[i-1]:parent]);
const seq=(prefix,n,parent)=>chain(parent,Array.from({length:n},(_,i)=>prefix+i));
const leg=(parent,id)=>chain(parent,[id+'Root',id+'Knee',id+'Foot']);
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function build(id,axis,graph,roles,gaits,{anchored=false,legs=[],rigid=[],optional={}}={}){
 const joints=['root',...graph.map(([j])=>j)];
 if(new Set(joints).size!==joints.length||joints.length>64)throw Error('Specialized template inventory '+id);
 const seen=new Set(['root']);for(const[j,p]of graph){if(!seen.has(p))throw Error('parent order '+id+'/'+j);seen.add(j);}
 return freeze({id,version:1,clipSetId:id+'-v1',graph,joints,legs,bodyAxis:axis,roles,gaits,anchored,rigid,optional,
 limitsDeg:Object.fromEntries(joints.map(j=>[j,{min:rigid.includes(j)?0:j==='root'?-12:-35,max:rigid.includes(j)?0:j==='root'?12:35}])),
 bounds:[{id:'body',min:.04,max:.9,kind:'distance',axis},{id:'bone-min',min:.001,max:.8,kind:'bone-min'},{id:'bone-max',min:.001,max:.8,kind:'bone-max'}],
 secondaryChains:[]});
}
const legIds=(n)=>Array.from({length:n},(_,i)=>['leg'+i+'Far','leg'+i+'Near']).flat();
const crustLegs=legIds(4),smallLegs=legIds(5),loboLegs=legIds(4),horseLegs=legIds(5);
const shellGraph=[['hinge','root'],['valveFar','hinge'],['valveNear','hinge'],['mantle','hinge'],['siphon','mantle'],['foot','mantle']];
const gastropodGraph=[...seq('foot',4,'root'),['head','foot3'],['mouth','head'],['eyeFar','head'],['eyeNear','head'],['shell','foot1']];
const wormGraph=seq('segment',12,'root');
const crustGraph=[['thorax','root'],['head','thorax'],...seq('abdomen',4,'thorax'),['tailFan','abdomen3'],
 ...crustLegs.flatMap(id=>leg('thorax',id)),...['Far','Near'].flatMap(s=>[...chain('head',['claw'+s+'Base','claw'+s+'Palm','claw'+s+'Finger']),...chain('head',['antenna'+s+'Base','antenna'+s+'Tip']),['eye'+s,'head']])];
const smallGraph=[['thorax','root'],['head','thorax'],...seq('abdomen',6,'thorax'),['tailFan','abdomen5'],
 ...smallLegs.flatMap(id=>leg('thorax',id)),...['Far','Near'].flatMap(s=>chain('head',['antenna'+s+'Base','antenna'+s+'Tip']))];
const loboGraph=[...seq('segment',4,'root'),['head','segment0'],['mouth','head'],...loboLegs.flatMap((id,i)=>leg('segment'+Math.floor(i/2),id))];
const horseGraph=[['prosoma','root'],['head','prosoma'],['opisthosoma','prosoma'],['telson','opisthosoma'],...horseLegs.flatMap(id=>leg('prosoma',id))];
const crabGraph=[['carapace','root'],...crustLegs.flatMap(id=>leg('carapace',id)),...['Far','Near'].flatMap(side=>[
 ...chain('carapace',['eye'+side+'Root','eye'+side+'Tip']),
 ...chain('carapace',['claw'+side+'Base','claw'+side+'Elbow','claw'+side+'Palm']),
 ...chain('claw'+side+'Palm',['claw'+side+'FixedRoot','claw'+side+'FixedTip']),
 ...chain('claw'+side+'Palm',['claw'+side+'DactylRoot','claw'+side+'DactylTip'])])];
export const SPECIALIZED_TEMPLATES=freeze({
 brachyuran:build('brachyuran',['root','carapace'],crabGraph,{legs:crustLegs.flatMap(id=>[id+'Root',id+'Knee',id+'Foot']),claws:['clawFarDactylRoot','clawNearDactylRoot'],reach:['clawFarBase','clawFarElbow','clawNearBase','clawNearElbow'],sensors:['eyeFarRoot','eyeNearRoot']},['scuttle'],{legs:crustLegs,rigid:['carapace','clawFarFixedRoot','clawFarFixedTip','clawNearFixedRoot','clawNearFixedTip','clawFarDactylTip','clawNearDactylTip']}),
 bivalve:build('bivalve',['hinge','mantle'],shellGraph,{valves:['valveFar','valveNear'],soft:['mantle','siphon','foot']},['settle','jet'],{optional:{siphon:['siphon'],foot:['foot']}}),
 gastropod:build('gastropod',['foot0','foot3'],gastropodGraph,{wave:['foot0','foot1','foot2','foot3'],head:['head','mouth'],sensors:['eyeFar','eyeNear']},['crawl'],{rigid:['shell'],optional:{shell:['shell'],eyes:['eyeFar','eyeNear']}}),
 annelid:build('annelid',['segment0','segment11'],wormGraph,{wave:wormGraph.map(([j])=>j)},['undulate']),
 'crustacean-clawed':build('crustacean-clawed',['thorax','abdomen3'],crustGraph,{legs:crustLegs.flatMap(id=>[id+'Knee',id+'Foot']),claws:['clawFarFinger','clawNearFinger'],reach:['clawFarBase','clawNearBase'],wave:['abdomen0','abdomen1','abdomen2','abdomen3','tailFan'],sensors:['antennaFarTip','antennaNearTip']},['scuttle','swim'],{legs:crustLegs}),
 'crustacean-small':build('crustacean-small',['thorax','abdomen5'],smallGraph,{legs:smallLegs.flatMap(id=>[id+'Knee',id+'Foot']),wave:Array.from({length:6},(_,i)=>'abdomen'+i).concat('tailFan'),sensors:['antennaFarTip','antennaNearTip']},['swim','crawl'],{legs:smallLegs,optional:{tailFan:['tailFan']}}),
 'sessile-filter':build('sessile-filter',['base','crown'],[['base','root'],['body','base'],['crown','body'],['aperture','crown']],{soft:['body','crown','aperture']},['anchored'],{anchored:true,rigid:['root','base']}),
 'colonial-filter':build('colonial-filter',['segment0','segment3'],seq('segment',4,'root').concat([['aperture','segment3']]),{wave:['segment0','segment1','segment2','segment3'],soft:['aperture']},['drift']),
 barnacle:build('barnacle',['base','mouth'],[['base','root'],['mouth','base'],['plateFar','mouth'],['plateNear','mouth'],...Array.from({length:6},(_,i)=>chain('mouth',['cirrus'+i+'Base','cirrus'+i+'Tip'])).flat()],{valves:['plateFar','plateNear'],sensors:Array.from({length:6},(_,i)=>'cirrus'+i+'Tip')},['anchored'],{anchored:true,rigid:['root','base']}),
 lobopod:build('lobopod',['segment0','segment3'],loboGraph,{wave:['segment0','segment1','segment2','segment3'],legs:loboLegs.flatMap(id=>[id+'Knee',id+'Foot']),head:['head','mouth']},['crawl'],{legs:loboLegs}),
 xiphosuran:build('xiphosuran',['prosoma','opisthosoma'],horseGraph,{legs:horseLegs.flatMap(id=>[id+'Knee',id+'Foot']),wave:['opisthosoma','telson']},['crawl'],{legs:horseLegs}),
 larva:build('larva',['segment0','segment7'],seq('segment',8,'root'),{wave:Array.from({length:8},(_,i)=>'segment'+i)},['undulate']),
});
export function specializedTemplate(id){return SPECIALIZED_TEMPLATES[id]??null;}
