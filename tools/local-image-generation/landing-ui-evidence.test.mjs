import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUiSample,validateUiClickGeometry,validateUiClickDelivery} from './landing-ui-evidence.mjs';
const names=['Civet','Persimmon','Platypus','Frog',"Devil's Club",'Cranberry'];
const expected={names,width:1024,height:576,jobKey:'exact-canonical-recipe-and-flags'};
const ids=['generate','planet','explore','notice-open','planet-panel','journal-panel','notice',
  'landing-progress','landing-label','landing-meter','painting','roster'];
const phases=['before-generate','running-planet','running-journal','denoise-progress',
  'progress-returned-journal','complete-still-journal','complete-returned-planet','completed-phone-layout-diagnostic'];
// Synthetic recordings exercise the same acceptor as native observations. These
// fixtures do not claim a browser run, real visibility or image acceptance.
function fixture(phase){
  const elements=Object.fromEntries(ids.map(id=>[id,{exists:true,hidden:false,visible:false,disabled:false,
    rect:{x:16,y:40,width:0,height:0},text:''}]));
  const show=id=>Object.assign(elements[id],{visible:true,hidden:false,rect:{x:16,y:40,width:288,height:30}});
  const hide=id=>Object.assign(elements[id],{visible:false,hidden:true,rect:{x:16,y:40,width:0,height:0}});
  show('planet');show('explore');hide('notice');hide('journal-panel');
  const initial=phase==='before-generate';
  const complete=phase.startsWith('complete');
  const journal=['running-journal','progress-returned-journal','complete-still-journal'].includes(phase);
  const sample={elements,state:initial?'ready':complete?'complete':'running',landingState:initial?null:complete?'complete':'running',
    jobKey:initial?null:expected.jobKey,startCount:initial?0:1,denoiseStep:phase==='denoise-progress'?2:0,
    meter:{hasValue:true,max:1,value:complete?1:phase==='denoise-progress'?0.5:0},
    painting:{width:1024,height:576},viewport:{width:1280,height:1000,scrollWidth:1280}};
  elements.roster.text=names.join('\n');elements['landing-label'].text='Landing · Painting the world · ETA about 20s + final processing';
  if(journal){hide('planet-panel');show('journal-panel');show('roster');}
  else show('planet-panel');
  if(initial||complete){
    if(!journal){show('generate');if(complete){show('painting');elements.painting.rect={x:16,y:300,width:1024,height:576};}}
    hide('landing-progress');
  }else{
    hide('generate');elements.generate.disabled=true;
    if(!journal){show('landing-progress');show('landing-label');show('landing-meter');}
  }
  if(phase==='complete-still-journal'){show('notice');show('notice-open');}
  if(phase==='completed-phone-layout-diagnostic'){
    sample.viewport={width:320,height:568,scrollWidth:320};elements.painting.rect={x:16,y:300,width:288,height:162};
  }
  return sample;
}
function rejectsMutation(phase,change,pattern){
  const sample=fixture(phase);assert.equal(validateUiSample(phase,sample,expected),true);
  change(sample);assert.throws(()=>validateUiSample(phase,sample,expected),pattern);
  assert.equal(validateUiSample(phase,fixture(phase),expected),true);
}

test('All named UI phases admit complete observations with the same job identity',()=>{
  for(const phase of phases)assert.equal(validateUiSample(phase,fixture(phase),expected),true);
  assert.throws(()=>validateUiSample('unknown',fixture('running-planet'),expected),/unknown observation/);
});

test('Text and numeric progress hidden by an ancestor cannot pass the actual progress acceptor',()=>{
  for(const id of ['planet-panel','landing-progress','landing-label','landing-meter'])
    rejectsMutation('denoise-progress',sample=>{sample.elements[id].visible=false;sample.elements[id].rect.width=0;},/must replace Land and be visible/);
  rejectsMutation('denoise-progress',sample=>{sample.elements.generate.hidden=false;sample.elements.generate.visible=true;},/replace Land/);
  rejectsMutation('running-planet',sample=>{sample.elements['landing-meter'].visible=false;},/visible/);
});

test('Pending meter/ETA/stage and notice mutations fail instead of accepting a static label',()=>{
  for(const value of [0,1,-1,NaN,Infinity])rejectsMutation('denoise-progress',sample=>{sample.meter.value=value;},/progress/);
  rejectsMutation('denoise-progress',sample=>{sample.meter.hasValue=false;},/progress fraction/);
  rejectsMutation('denoise-progress',sample=>{sample.meter.max=100;},/progress fraction/);
  rejectsMutation('denoise-progress',sample=>{sample.elements['landing-label'].text='Landing';},/Landing\/ETA/);
  rejectsMutation('denoise-progress',sample=>{sample.denoiseStep=1;},/step two/);
  rejectsMutation('denoise-progress',sample=>{sample.elements.notice.hidden=false;sample.elements.notice.visible=true;},/premature/);
});

test('Journal outcomes require all visible canonical names and the same continuing job',()=>{
  for(const phase of ['running-journal','progress-returned-journal']){
    rejectsMutation(phase,sample=>{sample.elements.roster.text=names.slice(0,5).join(' ');},/six-resident roster/);
    rejectsMutation(phase,sample=>{sample.elements.roster.visible=false;},/six-resident roster/);
    rejectsMutation(phase,sample=>{sample.elements['planet-panel'].hidden=false;sample.elements['planet-panel'].visible=true;},/journal/);
    rejectsMutation(phase,sample=>{sample.jobKey='different';},/changed or restarted/);
    rejectsMutation(phase,sample=>{sample.startCount=2;},/changed or restarted/);
    rejectsMutation(phase,sample=>{sample.state='complete';},/not actually pending/);
  }
});

test('False completion, premature navigation and a missing notification remain failures',()=>{
  rejectsMutation('complete-still-journal',sample=>{sample.landingState='running';},/not published/);
  rejectsMutation('complete-still-journal',sample=>{sample.state='running';},/not published/);
  rejectsMutation('complete-still-journal',sample=>{sample.elements.notice.visible=false;},/notify/);
  rejectsMutation('complete-still-journal',sample=>{sample.elements['journal-panel'].hidden=true;sample.elements['journal-panel'].visible=false;},/keeping the journal/);
  rejectsMutation('complete-still-journal',sample=>{sample.elements['notice-open'].disabled=true;},/notify/);
});

test('A delivered but inert View landfall action fails the final visible outcome',()=>{
  const stale=fixture('complete-still-journal');
  assert.throws(()=>validateUiSample('complete-returned-planet',stale,expected),/View landfall/);
  rejectsMutation('complete-returned-planet',sample=>{sample.elements.painting.visible=false;},/visible completed painting/);
  rejectsMutation('complete-returned-planet',sample=>{sample.elements.notice.hidden=false;sample.elements.notice.visible=true;},/dismiss the notice/);
  rejectsMutation('complete-returned-planet',sample=>{sample.painting.width=768;},/dimensions/);
});

test('Completed phone diagnostic rejects horizontal overflow without claiming phone inference',()=>{
  rejectsMutation('completed-phone-layout-diagnostic',sample=>{sample.viewport.scrollWidth=321;},/horizontal layout/);
  rejectsMutation('completed-phone-layout-diagnostic',sample=>{sample.elements.painting.rect.width=320;},/horizontal layout/);
  rejectsMutation('completed-phone-layout-diagnostic',sample=>{sample.viewport.width=1280;},/horizontal layout/);
});

test('The same native click acceptors reject covered, disabled, outside and untrusted observations',()=>{
  const geometry={exists:true,visible:true,disabled:false,hitMatches:true,x:100,y:50,
    viewport:{width:1280,height:1000},rect:{width:160,height:44}};
  assert.equal(validateUiClickGeometry('planet',geometry),true);
  for(const change of [{hitMatches:false},{visible:false},{disabled:true},{x:-1},{y:1000},{rect:{width:0,height:44}}])
    assert.throws(()=>validateUiClickGeometry('planet',{...geometry,...change}),/visibly actionable/);
  const delivered={overflow:false,events:[{id:'planet',isTrusted:true}]};
  assert.equal(validateUiClickDelivery('planet',delivered),true);
  for(const bad of [{overflow:true,events:delivered.events},{overflow:false,events:[]},
    {overflow:false,events:[{id:'planet',isTrusted:false}]},{overflow:false,events:[{id:'explore',isTrusted:true}]},
    {overflow:false,events:[...delivered.events,...delivered.events]}])
    assert.throws(()=>validateUiClickDelivery('planet',bad),/trusted native click/);
});
