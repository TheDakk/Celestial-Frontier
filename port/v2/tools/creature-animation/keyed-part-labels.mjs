import {hashBytes,hashJSON} from './quadruped-template.mjs';
import {cutPainterParts} from './part-masks.mjs';

/** Exact labels on the established authored keyer's output. The original PNG
 * and record stay bound; this is not native painter alpha or draw-stage labels. */
export async function cutKeyedParts(record,masterBytes,rgba,labels,declaration){
 const {declarationHash,schema,keyedRgbaSha256,...body}=declaration;
 if(schema!=='cf.keyed-part-intake/v1'||await hashJSON({schema,keyedRgbaSha256,...body})!==declarationHash)throw Error('Keyed labels: corrupted declaration');
 if(!/^[a-f0-9]{64}$/.test(keyedRgbaSha256??'')||await hashBytes(rgba)!==keyedRgbaSha256)throw Error('Keyed labels: changed keyed RGBA');
 // Reuse the existing exact raster ownership/identity/conservation guard. The
 // adapter changes only its internal schema tag, not pixels, labels or record.
 const internal={...body,schema:'cf.painter-part-intake/v1'};
 const result=await cutPainterParts(record,masterBytes,rgba,labels,{...internal,declarationHash:await hashJSON(internal)});
 return {...result,receipt:{...result.receipt,owner:'source-bound exact labels on authored keyer output; not painter draw stages',declarationHash,keyedRgbaSha256}};
}
