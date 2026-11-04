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
  if (!inventory || !keys(inventory.brokerLeased) || !keys(inventory.brokerCached)) errors.push('broker raw inventories missing');
  if (errors.length) return errors;
  if (inventory.brokerLeased.length !== observation.broker.leasedKeyCount || inventory.brokerCached.length !== observation.broker.cachedKeyCount) errors.push('broker raw inventory count');
  for (const image of observation.images) {
    const key = image.visualKey;
    if (typeof key !== 'string' || !key || key.length !== image.visualKeyLength) { errors.push('image visual key mismatch'); continue; }
    const bl = inventory.brokerLeased.indexOf(key), bc = inventory.brokerCached.indexOf(key);
    if ((bl < 0 ? null : bl) !== image.leasedIndex || (bc < 0 ? null : bc) !== image.cachedIndex) errors.push('broker image index mismatch');
    const broker = bl >= 0 && bc >= 0;
    const painted = p !== null && p.keys.leasedThumbs.includes(key) && p.keys.cachedThumbs.includes(key);
    if (broker === painted || (!broker && (bl >= 0 || bc >= 0)) || (broker && p?.keys.leasedThumbs.includes(key))) errors.push('image requires exactly one complete owner: ' + image.logicalId);
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
