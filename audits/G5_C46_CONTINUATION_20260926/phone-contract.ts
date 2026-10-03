/** C46 proof/publisher shares the ACTUAL runtime source identity and genuine rig admission. */
import {speciesVisualKey} from '../../port/v2/packages/art/src/speciesidentity.js';
import {getBattle2MasterPin} from '../../port/v2/apps/game/src/battle2-master-pins.generated.js';
import {creatureFinishLabelsPinV1} from '../../port/v2/apps/game/src/creature-finish-source-pins.generated.js';
import {preflightBattle2PinnedBytesV1} from '../../port/v2/apps/game/src/battle2-master-pin-admission.js';
import {finishSourceV1} from '../../port/v2/apps/game/src/creature-finish-route.js';
import {creatureFinishModelHashV1} from '../../port/v2/apps/game/src/creature-finish-app.js';
import {creatureFinishIdentityV1,createCreatureFinishEngineV1} from '../../port/v2/apps/game/src/creature-finish-engine.js';
export {createCreatureFinishEngineV1};
import {creatureOriginalKey,type AiCreatureOriginalV1} from '../../port/v2/apps/game/src/creature-originals.js';
import {admitCreatureFinishedAtlasV1,createCreatureFinishDeliveryV1} from '../../port/v2/apps/game/src/creature-finish-admission.js';
import {LocalModelSha256V1} from '../../port/v2/apps/game/src/local-model-sha256.js';
import {PINNED_LOCAL_MODEL_MANIFEST_V1} from '../../port/v2/apps/game/src/local-model-manifest.js';
export {createCreatureFinishDeliveryV1,creatureFinishModelHashV1};
export const IDS=['crab','freshwater-crab','mud-crab'] as const;
export const sha=(b:Uint8Array)=>new LocalModelSha256V1().update(b).digestHex();
export interface SourceBytes {record:Uint8Array;master:Uint8Array;labels:Uint8Array;binding:Uint8Array;alpha:Uint8Array;atlas:Uint8Array}
export function sourcePaths(id:string){if(!(IDS as readonly string[]).includes(id))throw Error('C46 three-source scope');const pin=getBattle2MasterPin(id);if(!pin)throw Error('Missing genuine rig pin');const lp=creatureFinishLabelsPinV1(pin);return {record:pin.recordPath,master:pin.masterPath,labels:lp.labelsPath,binding:pin.recordPath.replace(/record\.json$/,'binding.json'),alpha:pin.alphaPath,atlas:pin.atlasPath};}
/** The legacy crab record stores its canonical genome as the speciesVisualKey tagged JSON. Read, do not invent/reseed it. */
function genomeFromRecord(record:any):Record<string,unknown>{
 const root=JSON.parse(record.identity.speciesVisualKey);if(!Array.isArray(root)||root[0]!=='object'||!Array.isArray(root[1]))throw Error('canonical genome encoding');
 const genome:Record<string,unknown>={};for(const [key,value]of root[1]){if(typeof key!=='string'||!Array.isArray(value)||Object.hasOwn(genome,key))throw Error('canonical genome field');const [type,raw]=value;if(type==='number'){const n=Number(raw);if(!Number.isFinite(n))throw Error('genome number');genome[key]=n;}else if(type==='string'&&typeof raw==='string'||type==='boolean'&&typeof raw==='boolean')genome[key]=raw;else throw Error('canonical genome value');}
 if(speciesVisualKey(genome)!==record.identity.speciesVisualKey||genome.seed!==record.identity.seed)throw Error('canonical genome/seed mismatch');return genome;
}
export async function admittedSource(id:string,bytes:SourceBytes,authoringModelManifestHash:string){
 sourcePaths(id);const pin=getBattle2MasterPin(id)!,record=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.record)),labelsPin=creatureFinishLabelsPinV1(pin);
 if(sha(bytes.labels)!==labelsPin.labelsPngSha256)throw Error('labels pin');
 if(authoringModelManifestHash!==PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256)throw Error('authoring model manifest pin');
 const pinned={pin,creatureId:pin.creatureId,record,alphaPath:pin.alphaPath,alpha:bytes.alpha,bindingBytes:bytes.binding,atlasPath:pin.atlasPath,atlas:bytes.atlas};await preflightBattle2PinnedBytesV1(pinned);
 const genome=genomeFromRecord(record),source=await finishSourceV1({fit:{record,masterPng:bytes.master,labelsPng:bytes.labels,binding:bytes.binding},visualKey:speciesVisualKey(genome),identitySeed:Number(genome.seed),modelHash:creatureFinishModelHashV1()});
 if(source.recordRecipeHash!==pin.recipeHash||source.cutoutAssetHash!==pin.masterSha256||source.bindingHash!==pin.bindingSha256)throw Error('source pins');
 return {source,pinned,genome,identity:creatureFinishIdentityV1(source)};
}
export async function verifyFinished(id:string,bytes:SourceBytes,authoringModelManifestHash:string,original:AiCreatureOriginalV1){
 const input=await admittedSource(id,bytes,authoringModelManifestHash),key=creatureOriginalKey(input.identity),receipt=JSON.parse(original.receipt);
 if(original.key!==key||receipt.key!==key||creatureOriginalKey(receipt.identity)!==key||receipt.outputHash!==original.sha256||receipt.individualId!==input.source.individualId||receipt.visualKey!==input.source.visualKey)throw Error('runtime finished identity mismatch');
 const token=await admitCreatureFinishedAtlasV1(input.pinned,input.source,original,bytes.labels);
 return {key,source:input.source,identity:input.identity,genome:input.genome,token};
}
