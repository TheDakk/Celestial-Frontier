import { createHash } from 'node:crypto';
export const ownerKeyDigest = key => createHash('sha256').update(key).digest('hex');
/* The collector hashes inventories from a frozen snapshot. Images retain their
   exact raw keys; the contract independently hashes each before comparing.
   No producer diagnostic is mutated and no resource count is reduced. */
export function compactSettlementOwnership(raw, digest = ownerKeyDigest) {
  const o = structuredClone(raw), seen = new Map();
  const encode = values => values === null ? null : values.map(key => {
    if (typeof key !== 'string' || !key || key.length > 32768) throw Error('invalid owner key');
    const hash = digest(key);
    if (!/^[a-f0-9]{64}$/.test(hash) || (seen.has(hash) && seen.get(hash) !== key)) throw Error('owner identity digest invalid/collision');
    seen.set(hash, key); return hash;
  });
  o.ownerKeys = { encoding: 'sha256-v1', brokerLeased: encode(o.ownerKeys.brokerLeased), brokerCached: encode(o.ownerKeys.brokerCached) };
  if (o.paintedArt) for (const name of Object.keys(o.paintedArt.keys)) o.paintedArt.keys[name] = encode(o.paintedArt.keys[name]);
  return o;
}

/* V2-only ownership reduction. Raw broker and painted diagnostics stay separate.
   Never mutate a captured carrier or assign a painted key to the broker. */
const count = n => Number.isSafeInteger(n) && n >= 0;
const keys = v => Array.isArray(v) && v.length <= 4096 && v.every(k => typeof k === 'string' && k.length > 0 && k.length <= 32768) && new Set(v).size === v.length;
export function paintedFindings(p) {
  if (p === null) return [];
  if (!p || p.schema !== 'cf-v2-painted-card-ownership/v1') return ['painted ownership missing/schema'];
  const errors = [];
  for (const k of ['leasedThumbs','leasedPortraits','cachedThumbs','cachedPortraits','pendingThumbs','pendingPortraits']) if (!keys(p.keys?.[k])) errors.push('painted keys ' + k);
  for (const k of ['leases','cacheEntries','encodedBytes','decodedPixels','dataUrlBytes']) if (!count(p[k])) errors.push('painted counter ' + k);
  for (const kind of ['thumb','portrait']) {
    const b = p.byKind?.[kind];
    if (!b || !['entries','encodedBytes','decodedPixels','dataUrlBytes'].every(k => count(b[k]))) { errors.push('painted kind ' + kind); continue; }
    if (b.entries !== p.keys?.[kind === 'thumb' ? 'cachedThumbs' : 'cachedPortraits']?.length || b.decodedPixels !== b.entries * (kind === 'thumb' ? 132 ** 2 : 440 ** 2)) errors.push('painted cache conservation ' + kind);
    // Every retained PNG has its own 22-byte data-URL prefix and base64 rounding.
    if (b.dataUrlBytes < 22 * b.entries + 4 * Math.ceil(b.encodedBytes / 3) || b.dataUrlBytes > 22 * b.entries + 4 * Math.ceil(b.encodedBytes / 3) + 4 * Math.max(0, b.entries - 1)) errors.push('painted data URL basis ' + kind);
  }
  if (p.byKind?.thumb && p.byKind?.portrait) for (const [sum, field] of [['cacheEntries','entries'],['encodedBytes','encodedBytes'],['decodedPixels','decodedPixels'],['dataUrlBytes','dataUrlBytes']]) if (p[sum] !== p.byKind.thumb[field] + p.byKind.portrait[field]) errors.push('painted sum ' + sum);
  const r = p.residentArchetypes;
  if (!r || !['count','bytes','masterLabelBytes','maskBytes','masks'].every(k => count(r[k])) || !keys(r.names) || r.count !== r.names.length || r.bytes !== r.masterLabelBytes + r.maskBytes) errors.push('painted resident conservation');
  if (keys(p.keys?.leasedThumbs) && keys(p.keys?.leasedPortraits) && p.leases < p.keys.leasedThumbs.length + p.keys.leasedPortraits.length) errors.push('painted lease conservation');
  return errors;
}
export function paintedSettlementFindings(observation) {
  const p = observation.paintedArt, errors = paintedFindings(p), inventory = observation.ownerKeys;
  const digestKeys = values => keys(values) && values.every(k => /^[a-f0-9]{64}$/.test(k));
  if (inventory?.encoding !== 'sha256-v1' || !digestKeys(inventory.brokerLeased) || !digestKeys(inventory.brokerCached)) errors.push('broker digest inventories missing/invalid');
  if (p && Object.values(p.keys ?? {}).some(values => !digestKeys(values))) errors.push('painted digest inventories invalid');
  if (errors.length) return errors;
  if (inventory.brokerLeased.length !== observation.broker.leasedKeyCount || inventory.brokerCached.length !== observation.broker.cachedKeyCount) errors.push('broker raw inventory count');
  for (const image of observation.images) {
    const key = image.visualKey;
    if (typeof key !== 'string' || !key || key.length !== image.visualKeyLength) { errors.push('image visual key mismatch'); continue; }
    const digest = ownerKeyDigest(key);
    const bl = inventory.brokerLeased.indexOf(digest), bc = inventory.brokerCached.indexOf(digest);
    if ((bl < 0 ? null : bl) !== image.leasedIndex || (bc < 0 ? null : bc) !== image.cachedIndex) errors.push('broker image index mismatch');
    const broker = bl >= 0 && bc >= 0;
    const painted = p !== null && p.keys.leasedThumbs.includes(digest) && p.keys.cachedThumbs.includes(digest);
    if (broker === painted || (!broker && (bl >= 0 || bc >= 0)) || (broker && p?.keys.leasedThumbs.includes(digest))) errors.push('image requires exactly one complete owner: ' + image.logicalId);
  }
  if (p && p.keys.pendingThumbs.length + p.keys.pendingPortraits.length) errors.push('painted work pending');
  return errors;
}
/* Resource projection is named separately from either producer. Old numerical
   reducers consume this view; evidence retains the two original owner blocks.
   Resident archetype/mask bytes count in decodedBytes; CDP also sees their heap.
   decodedPixels retains its thumbnail-surface definition; portraits have their
   own counters. No ceiling or broker production diagnostic is changed. */
export function compendiumResources(snapshot) {
  const a = snapshot?.diagnostics?.art, p = snapshot?.diagnostics?.paintedArt;
  if (!a || paintedFindings(p).length) return null;
  if (p === null) return { ...a, resourceOwners: ['broker'], residentBytes: 0 };
  const b = p.byKind, union = (left, right) => [...(left ?? []), ...right];
  for (const [left,right] of [[a.keys?.leased,p.keys.leasedThumbs],[a.keys?.cached,p.keys.cachedThumbs]]) if (!keys(left) || left.some(k => right.includes(k))) return null;
  return { ...a, resourceOwners: ['broker','painted'], residentBytes: p.residentArchetypes.bytes,
    keys: { ...a.keys, leased: union(a.keys.leased,p.keys.leasedThumbs), cached: union(a.keys.cached,p.keys.cachedThumbs), queued: union(a.keys.queued,p.keys.pendingThumbs) },
    live: { ...a.live, cacheEntries: a.live.cacheEntries + b.thumb.entries,
      decodedPixels: a.live.decodedPixels + b.thumb.decodedPixels,
      decodedBytes: a.live.decodedBytes + b.thumb.decodedPixels * 4 + p.residentArchetypes.bytes,
      encodedBytes: a.live.encodedBytes + b.thumb.dataUrlBytes, leases: a.live.leases + p.leases,
      queuedJobs: a.live.queuedJobs + p.keys.pendingThumbs.length + p.keys.pendingPortraits.length,
      portraitCacheEntries: a.live.portraitCacheEntries + b.portrait.entries,
      portraitEncodedBytes: a.live.portraitEncodedBytes + b.portrait.dataUrlBytes } };
}
/* Worker-error injection belongs to broker-owned rows. Painted rows must remain
   ready and independently owned; they never satisfy a broker job/error count. */
export function paintedErrorRows(o) {
  if (paintedFindings(o?.paintedArt).length) return null;
  const p=o.paintedArt;
  const rows=o.rows ?? [], matched=[];
  for(const row of rows) if(p?.keys.leasedThumbs.includes(row.visualKey)) {
    if(!p.keys.cachedThumbs.includes(row.visualKey) || row.cached || row.thumbState!=='ready' || !row.complete || row.naturalWidth!==132 || row.naturalHeight!==132) return null;
    matched.push(row);
  }
  if(p && (p.keys.pendingThumbs.length || p.keys.pendingPortraits.length)) return null;
  return matched;
}
export function keyboardEntryExpression() {
  return `(()=>{const panel=document.getElementById('codexpanel');if(!panel)return null;
    const nodes=[...panel.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(e=>e.tabIndex>=0&&!e.disabled&&!e.closest('[inert]')&&e.getClientRects().length&&getComputedStyle(e).visibility==='visible');
    const token=e=>{if(e.dataset.cid)return 'row:'+e.dataset.cid;if(e.id)return 'id:'+e.id;for(const a of ['data-pnx','data-ck','data-cr','data-cshelves'])if(e.hasAttribute(a))return a+':'+e.getAttribute(a);return null};
    return {tokens:nodes.map(token),tabIndices:nodes.map(e=>e.tabIndex),active:token(document.activeElement)}})()`;
}
export function keyboardEntryPlan(observed, firstId) {
  const tokens=observed?.tokens, indices=observed?.tabIndices;
  if(!Array.isArray(tokens)||!Array.isArray(indices)||tokens.length!==indices.length||tokens.length>128||tokens.some(x=>typeof x!=='string'||!x)||new Set(tokens).size!==tokens.length||indices.some(x=>x!==0))throw new Error('keyboard entry inventory ambiguous');
  const from=tokens.indexOf(observed.active),to=tokens.indexOf('row:'+firstId);
  if(from<0||to<from||to-from>32)throw new Error('keyboard entry origin/target unreachable');
  return tokens.slice(from+1,to+1);
}
