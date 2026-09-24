# Local refinement review

Read-only comparison of retained candidate12/fit10 and candidate13/fit11. The new geometry resolves both regional pin conflicts without changing source ownership or pin policy. This is authoring/admission evidence only; static07 was being measured separately and no motion outcome is claimed here.

The only functional authoring delta is `meshRefinements[8].boundaryStep: 8 → 4` in rectangle `[812,570,62,74]`. Its `interiorStep:32` is unchanged. The other authoring delta is an explanatory coverage note. All16 refinement declarations,63 landmarks,31 fixed attachment sockets,32 texture parts,32 regional declarations and28 walking contact endpoints remain. Presence remains14 walking leg pairs plus1 ultimate pair. The master, presence, prompt, request, generation receipt and fit labels are byte-identical to candidate12/fit10.

| Existing source point | Refused fit10 | Compiled fit11 |
| --- | --- | --- |
| 841,617 | support1621, root1 hard pin | support1756, unpinned before and after regional compilation; final Knee weight0.382832241498465 |
| 851,622 | support1643, root1 hard pin | support1799, unpinned before and after regional compilation; final Knee weight0.3897503399852958 |

The unchanged soft gold shaft region now selects26 supports rather than20. Its retained compiler receipt reports519 painted pixels, zero shared supports and zero reused inherited locks. No support was excluded from the region to evade a conflicting pin. The previous seam-stencil diagnosis identifies why the coarser field coupled these points to the body; the newly compiled field no longer gives either point that inherited lock.

Mesh counts intentionally change:5058→5334 field vertices and8836→9353 field triangles. The pre-regional inherited pin count rises1590→1681. Every one of the1681 new inherited pins retains its exact index and weights through regional compilation;272 authored additional pins produce1953 final pins. These geometry/pin counts are not claimed unchanged. All joint/part inventories and policies are unchanged.

Both intake receipts identify the same executed intake and regional helper hashes. Base sampling remains40/80, fixed owners remain `['root']`, ordinary shape joints remain `[]`, regional diffusion remains32 iterations, and solver settings remain iterations4/globalIterations4/targetWeight0.35. The regional receipt's zero coordinate/topology/UV/ownership/profile changes describe its own pre-regional→final step, not equality between the two differently sampled fits.

Fit11 record authority: `39962065dde06970c0b494e3e2b959d363202fef2d9804658abc1a6bfacb7b16`; binding authority: `c67037345e169e813839fc96b66b0f1c05758cb0c9124a8326c2e42fa15a10aa`.

Selected file SHA-256 values:

| File | SHA-256 |
| --- | --- |
| candidate13 authoring.json | c35625a9055561a7ba5e07c699466716916717321595b93ccda9ddd8a9aaf97d |
| candidate13 master.png | e8173ea57501d604451cde79ec04715f28b683393c5de423750b4403abe4246e |
| candidate13 presence.json | cae77bbdf0505d7019f67276201e7b965fde5cb305d5d7caffe4c43caff0117c |
| fit11 labels.png | 637ea64a967c55876c31acb7c0aa2096e4a863cf73a9ae9cca8d76057313b477 |
| fit11 pre-regional-binding.json | 1b0113a3cfc5195c41471b067b26b9eb537c9043da588cb3dad278a1ecda1162 |
| fit11 binding.json | 4ebf5d0067f2062b1fd1ec4128a2b6f0f837d4f950aa6ac39ffd4bbf019ff56c |
| fit11 regional-authoring-receipt.json | d4697d8d352b82a8c641ac6455f8d6fdde0e51ca0eae75108afc02f7fff0f253 |
| packet regional-influences.mjs | 25a65459ce82a31c810bb2500778dcd975c67981b66e3f58b83c0fe72179501e |
| shared split-observed-surfaces.mjs | 4d0280d20b8a1b3032595d89e28ace3c56f2c2c570458e12efc6a79423daa084 |
| shared build-paint-skin.mjs | 55509deba10b18a005d4ae34e296a509036ab09fdad9ae623f3c640227429951 |

Read-only tool receipts:964ce3 (authoring/field/hash comparison),4dad65 (compact retained field and weight inspection),c75efd (policy/actual inherited-pin preservation comparison), all exit0. No tests, solves, intake or static/native runs were performed for this review.
