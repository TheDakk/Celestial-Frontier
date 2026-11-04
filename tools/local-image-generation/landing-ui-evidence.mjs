/** Pure acceptors for retained native landing observations. They do not create
 * DOM evidence, click controls, grant gameplay authority or accept image quality.
 * Visibility is measured by the runner through each actual ancestor; click hit
 * testing is a separate native observation and cannot be replaced by CSS flags. */
const IDS=['generate','planet','explore','notice-open','planet-panel','journal-panel',
  'notice','landing-progress','landing-label','landing-meter','painting','roster'];
const PHASES=new Set(['before-generate','running-planet','running-journal','denoise-progress',
  'progress-returned-journal','complete-still-journal','complete-returned-planet','completed-phone-layout-diagnostic']);
const finite=Number.isFinite;
function requireOutcome(condition,phase,detail){if(!condition)throw Error(`Landing UI ${phase}: ${detail}`);}
export function validateUiSample(phase,sample,expected){
  const check=(condition,detail)=>requireOutcome(condition,phase,detail);
  check(PHASES.has(phase),'unknown observation phase');
  check(sample&&typeof sample==='object'&&expected&&typeof expected==='object','missing observation/expectation');
  check(Array.isArray(expected.names)&&expected.names.length===6&&new Set(expected.names).size===6
    &&expected.names.every(name=>typeof name==='string'&&name.length>0),'invalid six-resident expectation');
  check(typeof expected.jobKey==='string'&&expected.jobKey.length>0,'missing expected job identity');
  check(expected.width>0&&expected.height>0,'invalid expected painting dimensions');
  const e=sample.elements;
  check(e&&IDS.every(id=>e[id]?.exists===true),'missing required control');
  const shown=id=>{const row=e[id];return row.visible===true&&row.hidden===false&&row.rect
    &&finite(row.rect.width)&&finite(row.rect.height)&&row.rect.width>0&&row.rect.height>0;};
  const hidden=id=>e[id].hidden===true&&e[id].visible===false;
  const planet=()=>shown('planet-panel')&&hidden('journal-panel');
  const journal=()=>shown('journal-panel')&&hidden('planet-panel')&&shown('roster')
    &&typeof e.roster.text==='string'&&expected.names.every(name=>e.roster.text.includes(name));
  const noticeAbsent=()=>hidden('notice');
  if(phase==='before-generate'){
    check(sample.state==='ready'&&sample.startCount===0&&planet()&&shown('generate')
      &&e.generate.disabled===false&&noticeAbsent(),'initial visible Land/planet state');
    return true;
  }
  check(sample.jobKey===expected.jobKey&&sample.startCount===1,'job changed or restarted');
  if(['running-planet','running-journal','denoise-progress','progress-returned-journal'].includes(phase)){
    check(sample.state==='running'&&['queued','running'].includes(sample.landingState),'job is not actually pending');
    check(noticeAbsent(),'premature completion notice');
    if(phase==='running-journal'||phase==='progress-returned-journal'){
      check(journal(),'journal/visible six-resident roster');return true;
    }
    check(planet()&&shown('landing-progress')&&shown('landing-label')&&shown('landing-meter')
      &&hidden('generate')&&e.generate.disabled===true,'pending progress must replace Land and be visible on the planet');
    check(typeof e['landing-label'].text==='string'&&e['landing-label'].text.includes('Landing')
      &&e['landing-label'].text.includes('ETA'),'visible Landing/ETA label');
    check(sample.meter?.hasValue===true&&sample.meter.max===1&&finite(sample.meter.value)
      &&sample.meter.value>=0&&sample.meter.value<1,'pending progress fraction');
    if(phase==='denoise-progress')check(sample.denoiseStep>=2&&sample.meter.value>0,'observed denoise progress after step two');
    return true;
  }
  check(sample.state==='complete'&&sample.landingState==='complete','completion not published');
  if(phase==='complete-still-journal'){
    check(journal()&&shown('notice')&&shown('notice-open')&&e['notice-open'].disabled===false,
      'completion must notify while keeping the journal selected');return true;
  }
  check(planet()&&shown('painting')&&noticeAbsent()&&shown('generate')&&e.generate.disabled===false,
    'View landfall must return to the visible completed painting and dismiss the notice');
  check(sample.painting?.width===expected.width&&sample.painting.height===expected.height,'completed painting dimensions');
  if(phase==='completed-phone-layout-diagnostic'){
    const v=sample.viewport,r=e.painting.rect;
    check(v?.width===320&&v.height===568&&finite(v.scrollWidth)&&v.scrollWidth<=v.width
      &&finite(r.x)&&r.x>=0&&r.x+r.width<=v.width,'small-phone horizontal layout');
  }
  return true;
}
export function validateUiClickGeometry(id,observed){
  requireOutcome(observed?.exists===true&&observed.visible===true&&observed.disabled===false&&observed.hitMatches===true
    &&finite(observed.x)&&finite(observed.y)&&observed.x>=0&&observed.y>=0
    &&finite(observed.viewport?.width)&&finite(observed.viewport?.height)
    &&observed.x<observed.viewport.width&&observed.y<observed.viewport.height
    &&observed.rect?.width>0&&observed.rect?.height>0,id,'button center is not visibly actionable');
  return true;
}
export function validateUiClickDelivery(id,delivered){
  requireOutcome(delivered?.overflow===false&&Array.isArray(delivered.events)&&delivered.events.length===1
    &&delivered.events[0].id===id&&delivered.events[0].isTrusted===true,id,'one trusted native click was not delivered');
  return true;
}
