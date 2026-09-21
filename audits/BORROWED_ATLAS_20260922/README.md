# Borrowed atlas ownership

Nick authorized an additive caller-owned atlas option for Claude's morph cache. loadCreatureRigV1 now accepts an optional seventh argument `{borrowedAtlas:true}` after the existing custom decoder. The decoder returns the cache's Texture. Omitted/false preserves default ownership. Admission hashes, dimensions, sampling guards, mesh/pose behavior and solver remain unchanged.

Ownership is captured at load. Rig disposal still releases containers, mesh geometry and per-part Texture wrappers; it does not destroy a borrowed atlas or its TextureSource. A decoded-dimension refusal also leaves a borrowed texture intact. The caller releases the shared texture/source only after all borrowing rigs are disposed. Do not set borrowedAtlas for a default decoder whose result the caller cannot retain. No cache or morph pipeline is implemented here.

```ts
const rig = await loadCreatureRigV1(record, binding, master, alpha, atlasBytes,
  async () => cachedAtlasTexture, {borrowedAtlas: true});
rig.dispose(); // cachedAtlasTexture and its source remain alive
// Cache eviction after every borrowing rig is disposed:
cachedAtlasTexture.destroy(true);
```

The single both-way unit control reproduced the old disposal bug before the patch (negative-before.log). After: ownership-control.log passes with two sharing rigs, caller cleanup, owned default cleanup, captured options and both dimension-refusal ownership modes. App typecheck passes (empty typecheck.log, exit 0). Root validation passes (validate.log). The one ordered S2 sweep has NOT run: it requires the signed loader producer after the signed marking commit. No repeated batteries or solver changes. Markings are in [their separate packet](../MORPH_CRAB_MARKINGS_20260922/README.md).

Marking packet signed and verified as d8a1a8f9941df45241e3ac0bd459fbc1b85932e8. This loader producer is next; its one S2 sweep follows its verified signature. No fetch/sync/push/PR/merge/release/deploy. Codex holds after this packet; Claude consumes the borrowed option for its morph texture cache and integrates the master-space marking masks; Nick reviews the six-mask sheet.
