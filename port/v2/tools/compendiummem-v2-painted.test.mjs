import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { materialize } from './compendiummem-v2-materialize.mjs';
import { paintedFindings, paintedSettlementFindings, compendiumResources, keyboardEntryPlan } from './compendiummem-v2-painted.mjs';
const dir = fs.mkdtempSync('/private/tmp/cf-i5-painted-controls-');
process.env.CF_COMPENDIUM_V2_SOURCE = new URL('../../..', import.meta.url).pathname;
materialize(dir);
const collector = await import(pathToFileURL(dir+'/collector.mjs'));
const contract = await import(pathToFileURL(dir+'/contract.mjs'));
const kind = (entries,size) => ({entries,encodedBytes:entries*3,dataUrlBytes:entries*26,decodedPixels:entries*size*size});
const painted = () => ({schema:'cf-v2-painted-card-ownership/v1',leases:1,cacheEntries:1,encodedBytes:3,decodedPixels:132**2,dataUrlBytes:26,
 keys:{leasedThumbs:['painted'],cachedThumbs:['painted'],pendingThumbs:[],leasedPortraits:[],cachedPortraits:[],pendingPortraits:[]},
 byKind:{thumb:kind(1,132),portrait:kind(0,440)},residentArchetypes:{count:1,bytes:1032,masterLabelBytes:1024,maskBytes:8,masks:1,names:['Crab']},totals:{renders:1,capEvictions:0,releasedUnowned:0}});
const observation=()=>({paintedArt:painted(),ownerKeys:{brokerLeased:['broker'],brokerCached:['broker']},broker:{leasedKeyCount:1,cachedKeyCount:1},images:[{logicalId:'a',visualKey:'broker',visualKeyLength:6,leasedIndex:0,cachedIndex:0},{logicalId:'b',visualKey:'painted',visualKeyLength:7,leasedIndex:null,cachedIndex:null}]});
test('mixed broker/painted rows admit only against their actual independent inventories',()=>{
 assert.deepEqual(paintedSettlementFindings(observation()),[]);
 for(const mutate of [o=>{o.paintedArt=null},o=>{o.paintedArt.keys.leasedThumbs=[]},o=>{o.paintedArt.keys.cachedThumbs=['different']},o=>{o.images[1].visualKey='forged!'},o=>{o.images[1].leasedIndex=0},o=>{o.paintedArt.keys.leasedThumbs.push('broker')},o=>{o.ownerKeys.brokerLeased=['different']},o=>{o.paintedArt.keys.pendingThumbs=['pending']}]) {
  const o=observation();mutate(o);assert.ok(paintedSettlementFindings(o).length);
 }
});
test('resource sums preserve broker evidence and include data URLs, masks and archetypes',()=>{
 const snapshot={diagnostics:{paintedArt:painted(),art:{schema:'broker',keys:{leased:['broker'],cached:['broker'],queued:[]},live:{cacheEntries:1,decodedPixels:132**2,decodedBytes:132**2*4,encodedBytes:50,leases:1,queuedJobs:0,portraitCacheEntries:0,portraitEncodedBytes:0}}}};
 const before=JSON.stringify(snapshot),r=compendiumResources(snapshot);
 assert.equal(r.live.decodedBytes,132**2*8+1032);assert.equal(r.live.encodedBytes,76);assert.equal(r.live.leases,2);assert.equal(JSON.stringify(snapshot),before);
 const p=snapshot.diagnostics.paintedArt;p.byKind.portrait=kind(1,440);p.keys.cachedPortraits=['portrait'];p.cacheEntries++;p.encodedBytes+=3;p.dataUrlBytes+=26;p.decodedPixels+=440**2;
 assert.equal(compendiumResources(snapshot).live.portraitEncodedBytes,26);
 for(const mutate of [p=>p.residentArchetypes.bytes--,p=>p.dataUrlBytes--,p=>p.byKind.thumb.dataUrlBytes=3,p=>p.decodedPixels--,p=>p.keys.cachedThumbs.push('painted')]) {const m=structuredClone(p);mutate(m);assert.ok(paintedFindings(m).length);}
 assert.ok(paintedFindings(undefined).length);
});
test('actual browser expression retains a painted row without laundering its broker indices',()=>{
 const page={targetId:'target',sessionId:'session',documentToken:'document'};
 const img={dataset:{visualKey:'painted',thumbState:'ready'},closest:()=>({dataset:{cid:'row'}}),getAttribute:()=> 'data:image/png;base64,AAAA',complete:true,naturalWidth:132,naturalHeight:132};
 const d={paintedArt:painted(),documentToken:'document',panel:{mode:'list',filteredCount:1},surfaces:{list:{imageCount:1,logicalIds:['row'],thumbStates:['ready']}},art:{keys:{leased:[],cached:[]},live:{}}};
 const expression=collector.candidateThumbSettlementExpression('list',1,page,'receipt');
 const o=vm.runInNewContext(expression,{window:{__CF_SLICE__:{api:{compendiumDiagnostics:()=>d}}},document:{querySelectorAll:()=>[img],visibilityState:'visible',hidden:false,hasFocus:()=>true}});
 assert.equal(o.images[0].leasedIndex,null);assert.equal(o.images[0].cachedIndex,null);assert.equal(o.images[0].visualKey,'painted');assert.equal(o.paintedArt.leases,1);assert.deepEqual([...o.ownerKeys.brokerLeased],[]);
 assert.deepEqual(paintedSettlementFindings(o),[]);
});
test('the retained calibration miss is refused; only matched painted ownership repairs that miss',()=>{
 const report=JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('../../../audits/I5_V2_EPOCH_20260925/epoch/calibration-1-report.json.gz',import.meta.url))));
 let found; const scan=v=>{if(!v||typeof v!=='object')return;if(v.images?.some?.(i=>i.logicalId==='cmem-0748')&&v.broker)found=v;for(const x of Object.values(v))scan(x)};scan(report);assert.ok(found);
 const o=structuredClone(found);o.paintedArt=null;o.ownerKeys={brokerLeased:[],brokerCached:[]};
 assert.ok(paintedSettlementFindings(o).length);
 // The old evidence lacks full keys. It is kept red, never relabelled as repaired evidence.
 assert.equal(o.images.find(i=>i.logicalId==='cmem-0748').leasedIndex,null);
});
test.after(()=>fs.rmSync(dir,{recursive:true}));
test('full classifier accepts a mixed-owner ready carrier and rejects wrong-owner forgery',()=>{
 const report=JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('../../../audits/ARCHETYPE_REPAIRS_20260922/01-i5/certificate/report.json.gz',import.meta.url))));
 let carrier;const scan=v=>{if(!v||typeof v!=='object')return;if(!carrier&&v.ready===true&&v.images?.length>1&&v.broker&&v.page)carrier=structuredClone(v);for(const c of Object.values(v))scan(c)};scan(report);assert.ok(carrier);
 carrier.paintedArt=null;const b=carrier.broker;
 carrier.ownerKeys={brokerLeased:Array.from({length:b.leasedKeyCount},(_,i)=>'lease-'+i),brokerCached:Array.from({length:b.cachedKeyCount},(_,i)=>'cache-'+i)};
 carrier.images.forEach((im,i)=>{im.visualKey='image-'+i;im.visualKeyLength=im.visualKey.length;carrier.ownerKeys.brokerLeased[im.leasedIndex]=im.visualKey;carrier.ownerKeys.brokerCached[im.cachedIndex]=im.visualKey});
 const expected=Object.fromEntries(['surface','expectedCount','receiptToken'].map(k=>[k,carrier[k]]));for(const k of ['targetId','sessionId','documentToken'])expected[k]=carrier.page[k];
 assert.equal(contract.classifyCompendiumThumbSettlement(carrier,expected).status,'ready');
 const im=carrier.images[0],key=im.visualKey;
 carrier.ownerKeys.brokerLeased[im.leasedIndex]='other-lease';carrier.ownerKeys.brokerCached[im.cachedIndex]='other-cache';im.leasedIndex=null;im.cachedIndex=null;
 carrier.paintedArt=painted();carrier.paintedArt.keys.leasedThumbs=[key];carrier.paintedArt.keys.cachedThumbs=[key];
 assert.equal(contract.classifyCompendiumThumbSettlement(carrier,expected).status,'ready');
 carrier.paintedArt.keys.cachedThumbs=['forged'];
 assert.notEqual(contract.classifyCompendiumThumbSettlement(carrier,expected).status,'ready');
});
test('native entry follows observed controls without a four-Tab assumption or focus injection',()=>{
 const tokens=['id:close',...Array.from({length:10},(_,i)=>'chip:'+i),'row:first','row:second'];
 const o={tokens,tabIndices:tokens.map(()=>0),active:'id:close'};
 assert.equal(keyboardEntryPlan(o,'first').length,11);
 for(const m of [{...o,active:'missing'},{...o,tokens:[...tokens,'chip:0']},{...o,tabIndices:tokens.map(()=>1)},{...o,tokens:tokens.map(()=>null)}])assert.throws(()=>keyboardEntryPlan(m,'first'));
 assert.deepEqual(keyboardEntryPlan({...o,active:'row:first'},'first'),[]);
 assert.throws(()=>keyboardEntryPlan({...o,active:'row:second'},'first'));
});
test('mixed-owner error control follows the first actual broker row and rejects missing recovery',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../../../audits/I5_REPAIR_20260927/epoch/calibration-1-report.json',import.meta.url)));
 const w=structuredClone(p.profiles.phone.producerErrorWitness);
 // Synthetic sibling fields on retained broker observations; these do not alter
 // or promote the stopped raw report. The retained rows prove error index 2.
 for(const phase of ['preArm','publication','recovery'])for(const o of [...w[phase].falsyObservations,w[phase].accepted].filter(Boolean)) {
  const owned=painted(); const rowKeys=o.rows?.slice(0,2).map(r=>r.visualKey)??[];
  if(!rowKeys.length){o.paintedArt=null;continue;}
  owned.keys.leasedThumbs=rowKeys;owned.keys.cachedThumbs=rowKeys;owned.leases=2;owned.cacheEntries=2;owned.encodedBytes=6;owned.decodedPixels=2*132**2;owned.dataUrlBytes=52;owned.byKind.thumb=kind(2,132);o.paintedArt=owned;
 }
 assert.equal(w.publication.accepted.rows.find(r=>r.thumbState==='error').index,2);
 assert.equal(contract.producerErrorContained(w,'phone'),true);
 assert.equal(contract.producerErrorRecoverable(w,'phone'),true);
 for(const mutate of [m=>{m.publication.accepted.rows[2].thumbState='ready';},m=>{m.publication.accepted.paintedArt.keys.cachedThumbs=['forged','other'];},m=>{m.recovery.accepted.rows[2].cached=false;},m=>{m.publication.accepted.art.totals.jobErrors=0;}]) {
  const mutant=structuredClone(w);mutate(mutant);assert.equal(contract.producerErrorRecoverable(mutant,'phone'),false);
 }
});
