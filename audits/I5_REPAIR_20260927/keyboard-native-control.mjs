/* Isolated synthetic native-tab control. Not a memory epoch or game certificate. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
import { keyboardEntryExpression, keyboardEntryPlan } from '../../port/v2/tools/compendiummem-v2-painted.mjs';
const browser=await openChromiumCdp({label:'I5 keyboard topology control',userDataPrefix:'cf-i5-keyboard-control',startupTimeoutMs:45000});
const report={scope:'synthetic native keyboard topology only',browser:browser.browser,steps:[]};
try {
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
 await browser.send('Page.enable',{},sessionId);await browser.send('Page.bringToFront',{},sessionId);
 const evaluate=async expression=>{const r=await browser.send('Runtime.evaluate',{expression,returnByValue:true},sessionId);assert.equal(r.exceptionDetails,undefined);return r.result.value};
 const chips=[...['all','Fauna','Flora','Fungi','Microbe'].map(k=>`<button data-ck="${k}">${k}</button>`),...[0,3,5,6].map(k=>`<button data-cr="${k}">${k}</button>`),'<button data-cshelves="on">Shelves</button>'].join('');
 await evaluate(`document.body.innerHTML=${JSON.stringify('<section id="codexpanel"><button data-pnx="codex">Close</button>'+chips+'<button data-cid="first">First species</button><button data-cid="second">Second species</button></section>')}`);
 const point=await evaluate("(()=>{const r=document.querySelector('[data-pnx]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
 for(const type of ['mousePressed','mouseReleased'])await browser.send('Input.dispatchMouseEvent',{type,...point,button:'left',clickCount:1},sessionId);
 const start=await evaluate(keyboardEntryExpression());const plan=keyboardEntryPlan(start,'first');assert.equal(plan.length,11);report.start=start;report.plan=plan;
 for(const expected of plan){for(const type of ['rawKeyDown','keyUp'])await browser.send('Input.dispatchKeyEvent',{type,key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9},sessionId);const observed=await evaluate(keyboardEntryExpression());assert.equal(observed.active,expected);report.steps.push({expected,actual:observed.active});}
 assert.notEqual(report.steps[3].actual,'row:first');assert.equal(report.steps.at(-1).actual,'row:first');report.status='PASS';
}finally{await browser.close();fs.writeFileSync(new URL('./keyboard-native-control.json',import.meta.url),JSON.stringify(report,null,2)+'\n')}
console.log('PASS: legacy four-Tab assumption fails; all eleven observed native steps match exactly.');
