import {test} from 'node:test';import assert from 'node:assert/strict';
import {admitsIphoneProbePage} from './iphone-navigation-contract.mjs';
test('only the committed secure isolated probe admits a model start; blank, wrong, insecure and unfinished documents reject',()=>{
 const origin='https://192.168.1.62:54321',page={url:origin+'/',secureContext:true,crossOriginIsolated:true,readyState:'complete',probeClient:true};
 assert.equal(admitsIphoneProbePage(page,origin),true);
 for(const mutant of [null,{}, {...page,url:'about:blank'},{...page,url:'https://example.invalid/'},{...page,secureContext:false},{...page,crossOriginIsolated:false},{...page,readyState:'loading'},{...page,probeClient:false}])assert.equal(admitsIphoneProbePage(mutant,origin),false);
});
