// Generated from tools/local-image-generation/model-manifest.json; metadata only.
// README is authoring evidence, not runtime delivery. No weights or download side effects.
import type { LocalModelManifestV1 } from './local-model-delivery.js';
export const PINNED_LOCAL_MODEL_MANIFEST_V1 = {
  "schema": "cf.local-model-delivery-manifest.v1",
  "modelId": "cgb/flux2-klein-4b-onnx-webgpu",
  "revision": "3bffc0efef1d9f84727036cdbc44df3b6ab51131",
  "sourceManifestSha256": "af5704496359448a4cea933cc57c01e9fe08c405b987dc17ffa32b256c1c4aef",
  "totalBytes": 6691020416,
  "files": [
    {
      "path": "text_encoder_q4-00000.data",
      "bytes": 1599733760,
      "sha256": "ed37b81331f4eda3bc150448f2d360b4e42951c57dcb9874ec8d0c7c78fa6f6d"
    },
    {
      "path": "text_encoder_q4-00001.data",
      "bytes": 594170880,
      "sha256": "89040c34be052e09698afad17bfea3e1158306369612ae347655dfbd4cfa0f3f"
    },
    {
      "path": "text_encoder_q4.manifest.json",
      "bytes": 285,
      "sha256": "fd22d7819467151ead49d2f25b0d576bcb65134111e5219c264cc605cb62e5b7"
    },
    {
      "path": "text_encoder_q4.onnx",
      "bytes": 5341471,
      "sha256": "e1670f1d203cf2e5cadecce4b2c13d436eefa228a66b7bc6bc629074e9dc0a1b"
    },
    {
      "path": "tokenizer/added_tokens.json",
      "bytes": 707,
      "sha256": "c0284b582e14987fbd3d5a2cb2bd139084371ed9acbae488829a1c900833c680"
    },
    {
      "path": "tokenizer/chat_template.jinja",
      "bytes": 4168,
      "sha256": "a55ee1b1660128b7098723e0abcd92caa0788061051c62d51cbe87d9cf1974d8"
    },
    {
      "path": "tokenizer/merges.txt",
      "bytes": 1671853,
      "sha256": "8831e4f1a044471340f7c0a83d7bd71306a5b867e95fd870f74d0c5308a904d5"
    },
    {
      "path": "tokenizer/special_tokens_map.json",
      "bytes": 613,
      "sha256": "76862e765266b85aa9459767e33cbaf13970f327a0e88d1c65846c2ddd3a1ecd"
    },
    {
      "path": "tokenizer/tokenizer.json",
      "bytes": 11422654,
      "sha256": "aeb13307a71acd8fe81861d94ad54ab689df773318809eed3cbe794b4492dae4"
    },
    {
      "path": "tokenizer/tokenizer_config.json",
      "bytes": 5404,
      "sha256": "443bfa629eb16387a12edbf92a76f6a6f10b2af3b53d87ba1550adfcf45f7fa0"
    },
    {
      "path": "tokenizer/vocab.json",
      "bytes": 2776833,
      "sha256": "ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910"
    },
    {
      "path": "transformer_q8-00000.data",
      "bytes": 1585446912,
      "sha256": "80aa4b75cdab0395f4374c51eecb59e005a6f81b3e573dddd9826a865bcd11be"
    },
    {
      "path": "transformer_q8-00001.data",
      "bytes": 1566572544,
      "sha256": "32576185e1f0ab3937141b0c57acad1f37f298c5e7951b3367096c129e5eca28"
    },
    {
      "path": "transformer_q8-00002.data",
      "bytes": 981258240,
      "sha256": "5062b615c62206a2dad22ce01fec6f674b0421336179cadec93fec77d1b2b455"
    },
    {
      "path": "transformer_q8.manifest.json",
      "bytes": 368,
      "sha256": "9cf98a614ffe690a297a286b11642b0611f67f64e80edaaf592645f32e727f29"
    },
    {
      "path": "transformer_q8.onnx",
      "bytes": 4991601,
      "sha256": "1c56c0b6ce5ce474a5ae5cc126ec3201516540e7f743de308dc07c9e72fb6102"
    },
    {
      "path": "vae_decoder.onnx",
      "bytes": 760826,
      "sha256": "05f3f6de75b760d5f3b6cbd6efa40ddc8bb7bc4dad58c1dabc85e96383871a7d"
    },
    {
      "path": "vae_decoder.onnx.data",
      "bytes": 198508544,
      "sha256": "357f7da253bfb9e3d5762a4f64fd126eae53b8b79466b7da2da2784d5fce89ae"
    },
    {
      "path": "vae_encoder.onnx",
      "bytes": 596081,
      "sha256": "f7cc93e70cc3a9555cb7bf1b02d2eaab83d706cf0a4ddf6da86dffb56daf05f9"
    },
    {
      "path": "vae_encoder.onnx.data",
      "bytes": 137756672,
      "sha256": "9ac7e0847f5b1a6a077ad38688042a53bc004e986d15dc8c0e37a962aad68671"
    }
  ]
} as const satisfies LocalModelManifestV1;
