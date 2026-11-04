import {test} from 'node:test';import assert from 'node:assert/strict';import {sampleSupportResidual} from './contact-support-probe.mjs';
test('separates exact triangle LBS, model covariance and published ARAP residual',()=>{
 const skin={vertices:[{x:100,y:100,weights:[['a',1]]},{x:200,y:100,weights:[['b',1]]},{x:100,y:200,weights:[['a',.5],['b',.5]]}]},mark={joint:'a',xy:[.125,.15],vertex:{triangle:[0,1,2],barycentric:[.25,.25,.5]}},matrices={a:[1,0,0,1,0,0],b:[0,1,-1,0,.5,0]},base={skin,mark,matrices,target:[.225,.15],width:1000,height:1000,prediction:[.225,.15]};
 const near=(actual,expected)=>actual.forEach((v,i)=>assert(Math.abs(v-expected[i])<1e-10));
 const exact=sampleSupportResidual({...base,current:[.225,.15]});near(exact.lbsPrediction,[.225,.15]);near(exact.kinematicResidualPx,[0,0]);near(exact.arapResidualPx,[0,0]);near(exact.modelToTriangleResidualPx,[0,0]);const old=sampleSupportResidual({...base,current:[.225,.15],prediction:[.2375,.1375]});assert(Math.hypot(...old.modelToTriangleResidualPx)>1);
 const moved=sampleSupportResidual({...base,current:[.2253,.1496]});near(moved.kinematicResidualPx,[0,0]);near(moved.arapResidualPx,[.3,-.4]);near(moved.publishedResidualPx,[.3,-.4]);assert(Math.hypot(...moved.publishedResidualPx)>.25);
 const kin=sampleSupportResidual({...base,target:[.224,.15],current:[.225,.15]});near(kin.kinematicResidualPx,[1,0]);near(kin.arapResidualPx,[0,0]);assert(Math.hypot(...kin.publishedResidualPx)>.25);
});
