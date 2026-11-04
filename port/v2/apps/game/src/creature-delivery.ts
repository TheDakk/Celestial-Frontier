/** D1 delivery only: no model, worker, rig, GPU or inference dependency. */
import type {AiCreatureInputV1,AiCreatureOriginalStoreV1} from './creature-originals.js';
import {creatureOriginalKey} from './creature-originals.js';
import {hashLandfallBlobV1} from './landfall-content-hash.js';
export async function deliverCreaturePngV1(input:{store:Pick<AiCreatureOriginalStoreV1,'find'>;identity:AiCreatureInputV1;retainedAllowed:boolean;retainedSha256:string;painter:Blob;painterSha256:string}) {
 creatureOriginalKey(input.identity);
 if(input.painter.type!=='image/png'||await hashLandfallBlobV1(input.painter)!==input.painterSha256)throw Error('Creature painter delivery hash');
 const fallback=(reason:string)=>Object.freeze({source:'painter' as const,blob:input.painter,sha256:input.painterSha256,reason,inferencePasses:0 as const});
 if(!input.retainedAllowed)return fallback('finish not selected');
 let original;try{original=await input.store.find(input.identity);}catch{return fallback('retained original unavailable or corrupt');}
 if(!original)return fallback('retained original missing');
 if(original.key!==creatureOriginalKey(input.identity)||original.blob.type!=='image/png'||original.sha256!==input.retainedSha256||await hashLandfallBlobV1(original.blob)!==input.retainedSha256)return fallback('retained original identity mismatch');
 return Object.freeze({source:'retained' as const,blob:original.blob,sha256:original.sha256,reason:'matching retained original',inferencePasses:0 as const});
}
