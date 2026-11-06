import test from'node:test';import assert from'node:assert/strict';import{mouthOffset,partTip}from'./contact.mjs';import{inspectEncounterCapture}from'./capture.mjs';
test('mirroring uses the same published mouth, not the opposite body end',()=>{
 const jaw=[70,20,90,25,80,30];assert.equal(mouthOffset(jaw,-50,1,1),40);assert.equal(mouthOffset(jaw,50,1,-1),-40);
 const leftHome=200,leftMouth=leftHome+40,target=leftMouth-12,rightOffset=mouthOffset(jaw,50,1,-1),rightHome=target-rightOffset;
 assert.equal((rightHome+rightOffset-leftMouth)*-1,12);
 // Former mirrored x0 uses the tail and passes its own placement equation.
 const wrongBodyOffset=50-10,wrongHome=target-wrongBodyOffset;
 assert.notEqual((wrongHome+rightOffset-leftMouth)*-1,12);
 assert.throws(()=>mouthOffset([],0,1,1));assert.throws(()=>mouthOffset([NaN,0],0,1,1));
});
const media={format:{duration:18.13},streams:[{codec_type:'video',nb_read_frames:1088,width:1600,height:900}]},live={fps:60,frames:1082,wholeFrameP95Ms:3,creatureP95Ms:{a:.8,b:1,c:.9}};
test('three-turn capture admits full film and rejects truncated, 30 Hz and over-budget controls',()=>{
 assert.equal(inspectEncounterCapture(media,live).status,'PASS');
 for(const duration of[10.1,17.99,19,NaN])assert.throws(()=>inspectEncounterCapture({...media,format:{duration}},live));
 assert.throws(()=>inspectEncounterCapture({...media,streams:[{...media.streams[0],nb_read_frames:540}]},live));
 assert.throws(()=>inspectEncounterCapture(media,{...live,fps:30}));
 assert.throws(()=>inspectEncounterCapture(media,{...live,creatureP95Ms:{a:2,b:1,c:1}}));
});

test('weapon contact uses the declared painted paw, not an unrelated jaw',()=>{const paw=[10,40,30,45,20,50],jaw=[70,10,90,20];assert.deepEqual(partTip(paw),{x:30,y:45});assert.notDeepEqual(partTip(paw),partTip(jaw));assert.throws(()=>partTip([]));assert.throws(()=>partTip([1,NaN]));});
