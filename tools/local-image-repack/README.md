# Q8 block-size repack · bounded derivative tool

Matches implementation as of September9,2026. This tool creates one **separate**
block32 variant of the exact pinned Klein transformer. It does not download,
requantize, run ONNX/WebGPU, change the parent model/cache files or establish
painting quality. The first reviewed coordinator run passed17 focused controls
and completed conversion with every347,332,608 new parameter byte independently
re-read. Exact controls and conversion evidence are retained in
`audits/LOCAL_AV_AI_CONTINUATION_20260909/repack-controls-01/` and
`audits/LOCAL_AV_AI_CONTINUATION_20260909/repack-conversion-01/`.

The derived graph is4,991,273 bytes, SHA256
`cda0a0e0d2778f83236557bcde8d474fed89a2fcbc817ea04f4758d2a064aed8`;
parameter data is347,332,608 bytes, SHA256
`5ba0370ea1eb7af85042aea2a143398990d87759efaf5f36857ad019ce066d82`.
This adds352,323,881 bytes (about336MiB) to this developer cache, excluding small
receipts. The separately reviewed browser bridge pins these two actual hashes;
its explicit `--q8-block32` experiment leaves the default/original model available.
Native loading, speed and raw-image comparison have their own result; conversion
status remains `DERIVATIVE_VERIFIED_RUNTIME_PENDING` as originally observed.

Parent graph: `transformer_q8.onnx`, SHA256
`1c56c0b6ce5ce474a5ae5cc126ec3201516540e7f743de308dc07c9e72fb6102`,
from `cgb/flux2-klein-4b-onnx-webgpu` revision
`3bffc0efef1d9f84727036cdbc44df3b6ab51131`. `parent-contract.json` pins
that graph and all three original external shards. The converter hashes those
three shards once before writing data; original handles remain read-only, open,
and checked for filesystem identity/size/time changes after conversion. This
uses the shared foreground/toolchain lock; it is not a defense against a hostile
concurrent writer restoring timestamps. The coordinator owns that lock.

## Mathematical/source gate

Read-only all103-node metadata and bounded byte examples are recorded in
`audits/LOCAL_AV_AI_CONTINUATION_20260909/q8-block32-feasibility.json`, SHA256
`32a0792af7ef9c34d3ca34b9e5f14020a12cfaaac35c743476897b0f6282cc57`.
The first byte diagnostic incorrectly asserted absent zero points; its explicit
failure/read130bytes is retained there. Corrected examples used actual scale/zero
bytes and compared768 represented weights after786 further bytes of bounded reads.
No full shard scan was part of that feasibility inspection.

All103 nodes have uint8 B `[N,K/128,128]`, float16 scales `[N,K/128]` and **explicit
uint8 zero points** `[N,K/128]`. B/scales/zeros are unique single-consumer tensors,
K is divisible128, opsets are ONNX18 + com.microsoft1, and there is no g_idx/bias.
No changed initializer occurs among the5 graph inputs,1 output or2938 value_info
annotations. The converter checks this absence; it refuses conflicting annotations.

For row n and coordinate k, original B address is
`(n*(K/128)+floor(k/128))*128+(k%128) = n*K+k`.
The new address is
`(n*(K/32)+floor(k/32))*32+(k%32) = n*K+k`.
Thus **B bytes and original shard ranges are reused unchanged**, with only B's
shape reinterpreted. Each old scale's exact two bytes and each old zero byte are
repeated four consecutive times. Every represented scalar retains the same
`(q - zero) * scale` operands; no scale arithmetic or new quantization occurs.
The new kernel changes multiplication/accumulation order, so matching represented
weights does **not** promise bit-identical activations, RGB, quality or speed.

Pinned ORT1.29.0 commit `2e2543fbe9fae542f921d47a72d21d5a4ef0b710`:

- [Wide-tile predicate](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/contrib_ops/webgpu/quantization/matmul_nbits_common.cc#L67-L93):
  block32, components_a4/components_b4, bits≠2, no indirect weight index, M≥4.
  Source SHA256 `edc34718a636a14f78f3d442c2070b15c54e907f65c16433d317e31836836297`.
- [Default Q8 dequantization](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/contrib_ops/webgpu/quantization/matmul_nbits.wgsl.template#L140-L159),
  SHA256 `19e59e8fb3e3c08a118d1b062ef11cc3476b7a9a4814ed4671c2a8fd8fffce6c`.
- [Wide-tile Q8 loads/dequantization](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/contrib_ops/webgpu/quantization/matmul_nbits_wide_tile.wgsl.template#L135-L183),
  SHA256 `902fb4eaca93892fb88572997838bfb163e21883768458eeea4c23decb3f690f`.

The completed baseline profile observes all103 nodes at M512/2472/2984 across412
dispatches,197359252µs (95.501504% of measured GPU duration). This proves the M
condition for that recipe, not the new kernel's speed or output fidelity.

## Prepared execution and output

Run focused checks once after review, under the shared owner:

```sh
node --test tools/local-image-repack/protobuf.test.mjs tools/local-image-repack/model.test.mjs
```

The17 prepared cases cover known protobuf bytes and unknown/noncanonical fields,
malformed wire boundaries, pinned-parent rejection, exact serialized-field
preservation, missing zero points/types/shapes/annotations/consumer conflicts,
wrong offsets, all256 quantized values with nonuniform scale/zero operands,
independent disk re-read validation with a middle-of-tensor corruption, source
hash rejection and refused existing output ownership. Synthetic checks do not
establish successful loading of the real derived graph; native ORT owns that gate.

After review/checks, the caller creates an **existing ignored parent directory**,
then selects an output directory that does not exist:

```sh
node tools/local-image-repack/repack.mjs --source VERIFIED_PARENT_CACHE --output NEW_IGNORED_DIRECTORY
```

Both directories must be strictly within the existing ignored model-cache root;
source/output cannot contain each other. Symlinks and existing/partial output
reuse are refused. Original files are opened read-only. New data is streamed with
64KiB input chunks, expanded at most4×; source hashing uses bounded4MiB chunks.
Every new scale/zero byte is independently re-read and compared via inverse block
addressing. B range identity and every unmodified serialized protobuf field are
verified; unknown supported fields retain their original bytes/order. Unsupported
wire groups/ambiguous singular fields fail, rather than being discarded.

Output:

- `transformer-q8-block32.onnx`: new graph with103 block_size attributes and309
  initializer declarations changed; no timestamp or machine path is inserted.
- `repacked-scale-zero.data`: exactly347332608 bytes (231555072 scales +115777536
  zeros), deterministic repeated source bytes. Original3 shard filenames/ranges
  remain external references; no B shard copies.
- `derivative-manifest.json`: schema `cf.q8-block32-derivative/v1`, parent
  model/revision/graph/shard hashes, derived graph/data hashes, exact206 tensor
  ranges/slice hashes, converter hashes and represented-weight validation scope.
  It remains proof-only: runtimeVerified/qualityAccepted are false.
- `start.json` and `receipt.json`: lifecycle/outcome; successful status is
  `DERIVATIVE_VERIFIED_RUNTIME_PENDING`. Existing output is never reused. Each
  admitted invocation also gets a unique ignored `repack-attempts/<id>/receipt.json`,
  so a refused existing output has separate failure evidence. Admission failures
  before an allowed cache root exists remain errors on stderr, not cache writes.

The bridge must resolve original filenames against its own verified canonical
cache, not trust `parent.sourceDirectory` from a manifest. Require the successful
conversion receipt, then freshly hash graph/data/shards and verify an exact
manifest/variant before native loading. File metadata, creation timestamps and
absolute provenance paths in receipts/manifests are not model inputs. Byte
hashes must be pinned only after actual conversion succeeds; never substitute
this feasibility document for that evidence.
