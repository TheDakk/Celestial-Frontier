---
license: apache-2.0
base_model: black-forest-labs/FLUX.2-klein-4B
library_name: onnx
tags:
  - text-to-image
  - onnx
  - onnxruntime-web
  - webgpu
  - in-browser
pipeline_tag: text-to-image
---

# FLUX.2 Klein 4B, ONNX for the browser

FLUX.2 Klein 4B exported to ONNX so it runs **entirely inside a web browser** on WebGPU,
through ONNX Runtime Web. No server, no API key, no upload: the weights are
cached by the browser and every image is generated on the visitor's own GPU.

## Try it without downloading anything

**[Generate an image at freegen.ai/imagine](https://freegen.ai/imagine)**

That is this exact pack, driven by the pipeline described below. 512x512 at 4
steps takes about 22 seconds on a recent discrete GPU. First use downloads
6.5 GB once and then works offline.

![an old bookshop with a cat in the window](samples/klein-an-old-bookshop-with-a-cat-in-the-window.png)
*Prompt: "an old bookshop with a cat in the window". 512x512, 4 steps, generated in a browser.*

## What this is

A re-export of the Apache-2.0 upstream, [black-forest-labs/FLUX.2-klein-4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B), into a
form ONNX Runtime Web can actually execute. The text encoder is Qwen3-4B, also
Apache-2.0. Everything here carries the same licence as the upstream, including
commercial use.

It exists because the only other browser build of this model declares no licence
at all, which makes it unusable in a product. The weights themselves are
Apache-2.0 and free to re-export, so we did.

## Files

| File | Precision | Size | Cosine vs PyTorch |
| --- | --- | --- | --- |
| `text_encoder_q4.onnx` | int4 weight-only, block size 128 | 2.20 GB | 0.999232 |
| `transformer_q8.onnx` | int8 weight-only, block size 128 | 4.14 GB | 0.999426 |
| `vae_decoder.onnx` | float32 | 0.20 GB | 1.000000 |

Anything above 2 GB is split into shards. A browser cannot allocate a single
2 GiB `ArrayBuffer`, and ONNX Runtime reads each external data file into one, so
an unsharded 4 GB weight file fails with nothing more useful than "Failed to
fetch". `*.manifest.json` lists the shards for each graph:

```json
{ "shards": [{ "path": "transformer_q8-00000.data" }, ...] }
```

Pass them to `InferenceSession.create` as `externalData`, mapping each recorded
`path` to its URL.

## Running it

This is three graphs and a flow-matching loop, not a single model, so it needs a
driver. The shape of one:

```js
// 1. Encode the prompt. Qwen2 tokenizer, chat template, padded to 512.
const { prompt_embeds } = await textEncoder.run({ input_ids, attention_mask });

// 2. Denoise. sigma is passed straight in as `timestep`.
let latent = gaussianNoise(sequence * 128);          // sequence = (h/16) * (w/16)
for (let step = 0; step < steps; step++) {
  const { noise_pred } = await transformer.run({
    hidden_states: f16(latent),                      // [1, sequence, 128]
    encoder_hidden_states: prompt_embeds,            // [1, 512, 7680]
    timestep: f16([sigmas[step]]),
    img_ids, txt_ids                                 // [t, h, w, l] positions
  });
  const delta = sigmas[step + 1] - sigmas[step];
  for (let i = 0; i < latent.length; i++) latent[i] += delta * noise_pred[i];
}

// 3. Decode. Unpack tokens to channel-first first: token i holds every
//    channel of the pixel at (i / width, i % width).
const { sample } = await vaeDecoder.run({ packed_latent });
```

Two things that are easy to get wrong:

- **Give each graph its own worker and terminate it when the stage is done.**
  ONNX Runtime's WebGPU backend does not return GPU memory when a session that
  has actually run is released. Loading the text encoder, running it, releasing
  it and then loading the denoiser fails, while loading either alone succeeds.
  Terminating the worker is what actually frees the device.
- **The sigma schedule uses dynamic shifting**, from this checkpoint's own
  scheduler config: `base_shift` 0.5, `max_shift` 1.15 over 256 to 4096 image
  tokens. A FLUX.1-era schedule gives visibly worse images. At 1024 image tokens
  mu is 0.63, giving `[1, 0.849, 0.652, 0.385, 0]` for 4 steps.

Inputs and outputs:

- **text_encoder**: input_ids [batch, sequence] int64, attention_mask [batch, sequence] int64 -> prompt_embeds [batch, sequence, 7680] float16
- **transformer**: hidden_states [batch, image_sequence, 128] float16, encoder_hidden_states [batch, text_sequence, 7680] float16, timestep [batch] float16, img_ids [batch, image_sequence, 4] int64, txt_ids [batch, text_sequence, 4] int64 -> noise_pred [batch, image_sequence, 128] float16
- **vae_decoder**: latent [batch, 32, height, width] float32 -> sample [batch, 3, 8*height, 8*width] float32

## What was changed in the export

Each of these was found by verifying against PyTorch rather than trusting the
export, and each one silently produces wrong images if you get it wrong.

- **The text encoder returns hidden states, not logits.** Layers 9, 18 and 27,
  stacked then permuted and flattened to 7680, the transformer's
  `joint_attention_dim`. The export does the reshape so a caller cannot get it
  wrong. It is truncated to 28 of 36 layers: layer 27 is the deepest state read,
  and one extra layer is kept because the final norm is applied to the *last*
  hidden state, so cutting at 27 changes the very tensor being read and drops
  cosine to 0.81.
- **The denoiser is int8, not int4.** int4 measured cosine 0.849 against PyTorch
  at block size 128, and 0.905 at block size 32, versus 0.9994 at int8.
  Diffusion transformers tolerate weight quantization far less than language
  models do, and it is the whole reason this pack is 6.5 GB rather
  than under 5. The text encoder is perfectly happy at int4.
- **Rotary embeddings are computed in float32.** Upstream hardcodes float64 off
  Apple hardware, and ONNX Runtime has no float64 `Cos` kernel on any backend,
  so the graph cannot execute at all.
- **LayerNorms are computed in float32.** FLUX.2 keeps its residual stream inside
  float16 by clamping it to +/-65504, and squaring a saturated 65504 has no
  float16 result, so the variance overflows and every normalised value becomes
  NaN. ONNX Runtime's CPU provider hides this by reducing in float32, so the
  graph verifies perfectly there and still returns an all-NaN prediction on
  WebGPU, for part of the timestep range only. The RMSNorms come out of the
  exporter in float32 already; the 41 `LayerNormalization` nodes do not.
- **The VAE has no `scaling_factor`.** It denormalises with batch-norm running
  statistics, then unpatchifies 2x2, then decodes. All three steps are folded
  into the exported graph, and it is left unquantized: it is small, and
  quantizing a decoder reliably adds banding and colour shifts for almost no
  saving.
- **The transformer takes sigma, not a timestep.** The pipeline passes `t / 1000`
  where `t = sigma * 1000`.

Every graph is checked against the PyTorch reference on identical inputs before
it is published.

## More models that run in your browser

[FreeGen](https://freegen.ai) runs open models entirely on your own machine.
Nothing is uploaded, there is no account, and there is no per-use cost.

| | |
| --- | --- |
| [Imagine](https://freegen.ai/imagine) | This model, plus Janus-Pro for a lighter option |
| [Chat](https://freegen.ai/chat) | Streaming local assistant |
| [Transcribe](https://freegen.ai/transcribe) | Whisper, up to large-v3-turbo |
| [Speak](https://freegen.ai/speak) | 28 Kokoro voices, offline |
| [Look](https://freegen.ai/look) | Caption, detection, OCR, visual questions |
| [Edit](https://freegen.ai/edit) | Click-to-select, cutout, upscale, depth |
